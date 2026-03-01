"""
Кастомный middleware для режима обслуживания.
Расширяет функциональность django-maintenance-mode для чтения
allowed_ips и allowed_urls из базы данных.
"""
import re
import logging
from django.conf import settings
from django.core.cache import cache
from django.http import JsonResponse
from django.shortcuts import render

logger = logging.getLogger(__name__)

# Список URL-паттернов, которые всегда разрешены (не блокируются при maintenance mode)
ALWAYS_ALLOWED_URLS = [
    r'^/static/',
    r'^/media/',
    r'^/api/health',
    r'^/admin/login',
]


class MaintenanceModeEnforcementMiddleware:
    """
    Middleware для проверки роли admin, IP-адресов и URL при активном режиме обслуживания.
    
    Этот middleware дополняет стандартный maintenance_mode.middleware.MaintenanceModeMiddleware
    и позволяет динамически читать списки разрешённых IP и URL из базы данных.
    
    Проверка выполняется в следующем порядке (от высокого приоритета к низкому):
    1. Если URL в списке ALWAYS_ALLOWED_URLS (статика, health check) - пропускаем
    2. Если пользователь имеет роль admin (is_admin() или role='admin') - пропускаем
    3. Если пользователь staff или superuser - пропускаем
    4. Если IP в whitelist (из БД) - пропускаем
    5. Если URL в whitelist (из БД) - пропускаем
    6. Иначе - возвращаем 503
    """
    
    # Ключ для кэширования настроек
    CACHE_KEY = 'maintenance_mode_whitelist'
    CACHE_TIMEOUT = 60  # 1 минута
    
    def __init__(self, get_response):
        self.get_response = get_response
    
    def __call__(self, request):
        # Проверяем, нужен ли maintenance mode
        if not self._is_maintenance_mode_active():
            # Режим обслуживания выключен - пропускаем запрос без изменений
            return self.get_response(request)
        
        # Проверяем, нужно ли игнорировать maintenance для этого запроса
        if self._should_ignore_request(request):
            return self.get_response(request)
        
        # Проверяем, разрешён ли запрос на основе роли, IP или URL
        if self._is_request_allowed(request):
            return self.get_response(request)
        
        # Запрос не разрешён - возвращаем 503
        return self._get_maintenance_response(request)
    
    def _is_maintenance_mode_active(self):
        """
        Проверить, активен ли режим обслуживания.
        Использует backend django-maintenance-mode для совместимости.
        """
        try:
            from maintenance_mode.core import get_maintenance_mode
            return get_maintenance_mode()
        except Exception as e:
            logger.error("Error checking maintenance mode: %s", e)
            return False
    
    def _should_ignore_request(self, request):
        """
        Проверить, нужно ли игнорировать maintenance mode для этого запроса.
        Учитывает настройки из django-maintenance-mode.
        """
        # Проверка для staff пользователей
        if getattr(settings, 'MAINTENANCE_MODE_IGNORE_STAFF', False):
            if hasattr(request, 'user') and request.user.is_authenticated:
                if request.user.is_staff:
                    return True
        
        # Проверка для superusers
        if getattr(settings, 'MAINTENANCE_MODE_IGNORE_SUPERUSER', False):
            if hasattr(request, 'user') and request.user.is_authenticated:
                if request.user.is_superuser:
                    return True
        
        # Проверка для аутентифицированных пользователей
        if getattr(settings, 'MAINTENANCE_MODE_IGNORE_AUTHENTICATED_USER', False):
            if hasattr(request, 'user') and request.user.is_authenticated:
                return True
        
        # Проверка для анонимных пользователей
        if getattr(settings, 'MAINTENANCE_MODE_IGNORE_ANONYMOUS_USER', False):
            if not hasattr(request, 'user') or request.user.is_anonymous:
                return True
        
        # Проверка для admin site
        if getattr(settings, 'MAINTENANCE_MODE_IGNORE_ADMIN_SITE', False):
            if request.path.startswith('/admin/'):
                return True
        
        return False
    
    def _is_request_allowed(self, request):
        """
        Проверить, разрешён ли запрос на основе роли, IP или URL.
        Порядок проверки: роль -> IP -> URL (от высокого приоритета к низкому).
        """
        # 1. Проверяем, не относится ли URL к статике или health check (всегда разрешено)
        if self._is_url_always_allowed(request.path):
            return True
        
        # 2. Проверяем роль пользователя (приоритетнее IP и URL)
        if self._is_user_admin(request):
            return True
        
        # 3. Проверяем IP-адрес
        client_ip = self._get_client_ip(request)
        if client_ip and self._is_ip_allowed(client_ip):
            return True
        
        # 4. Проверяем URL
        if self._is_url_allowed(request.path):
            return True
        
        return False
    
    def _is_url_always_allowed(self, path):
        """
        Проверить, относится ли URL к статике или always-allowed endpoints.
        """
        for pattern in ALWAYS_ALLOWED_URLS:
            try:
                url_re = re.compile(pattern)
                if url_re.match(path):
                    return True
            except re.error:
                # Если не regex - точное совпадение или startswith
                if pattern == path or path.startswith(pattern.rstrip('$').rstrip('/')):
                    return True
        return False
    
    def _is_user_admin(self, request):
        """
        Проверить, является ли пользователь админом.
        Учитывает:
        - is_staff
        - is_superuser  
        - роль admin (через is_admin() метод или role='admin')
        """
        if not hasattr(request, 'user'):
            return False
        
        if not request.user.is_authenticated:
            return False
        
        user = request.user
        
        # Проверка is_staff
        if user.is_staff:
            return True
        
        # Проверка is_superuser
        if user.is_superuser:
            return True
        
        # Проверка роли admin через метод is_admin()
        try:
            if hasattr(user, 'is_admin') and callable(user.is_admin):
                if user.is_admin():
                    return True
        except Exception as e:
            logger.warning("Error checking is_admin(): %s", e)
        
        # Проверка напрямую через поле role
        if hasattr(user, 'role') and str(user.role) == 'admin':
            return True
        
        return False
    
    def _is_ip_allowed(self, client_ip):
        """
        Проверить, разрешён ли IP-адрес.
        """
        whitelist = self._get_whitelist_from_db()
        ips = whitelist.get('ips', [])
        
        if not ips:
            return False
        
        for ip_pattern in ips:
            try:
                # Поддержка regex паттернов
                ip_re = re.compile(ip_pattern)
                if ip_re.match(client_ip):
                    return True
            except re.error:
                # Если не regex - точное совпадение
                if ip_pattern == client_ip:
                    return True
        
        return False
    
    def _is_url_allowed(self, path):
        """
        Проверить, разрешён ли URL.
        """
        whitelist = self._get_whitelist_from_db()
        urls = whitelist.get('urls', [])
        
        if not urls:
            return False
        
        for url_pattern in urls:
            try:
                # Поддержка regex паттернов
                url_re = re.compile(url_pattern)
                if url_re.match(path):
                    return True
            except re.error:
                # Если не regex - точное совпадение или startswith
                if url_pattern == path or path.startswith(url_pattern.rstrip('$')):
                    return True
        
        return False
    
    def _get_whitelist_from_db(self):
        """
        Получить списки разрешённых IP и URL из базы данных.
        Результат кэшируется для производительности.
        """
        # Пробуем получить из кэша
        cached = cache.get(self.CACHE_KEY)
        if cached is not None:
            return cached
        
        try:
            from users.models import MaintenanceMode
            
            maintenance = MaintenanceMode.objects.get_instance()
            
            whitelist = {
                'ips': maintenance.allowed_ips or [],
                'urls': maintenance.allowed_urls or [],
            }
        except Exception as e:
            logger.error("Error getting whitelist from DB: %s", e)
            # Fallback на настройки из settings
            whitelist = {
                'ips': getattr(settings, 'MAINTENANCE_MODE_IPS', []),
                'urls': getattr(settings, 'MAINTENANCE_MODE_URLS', []),
            }
        
        # Кэшируем результат
        cache.set(self.CACHE_KEY, whitelist, self.CACHE_TIMEOUT)
        
        return whitelist
    
    def _get_client_ip(self, request):
        """
        Получить IP-адрес клиента из запроса.
        Учитывает прокси и X-Forwarded-For заголовок.
        """
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            # Берём первый IP из списка (реальный клиент)
            ip = x_forwarded_for.split(',')[0].strip()
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip
    
    def _get_maintenance_response(self, request):
        """
        Возвращает ответ 503 Service Unavailable.
        """
        # Пробуем получить информацию о времени завершения
        try:
            from users.models import MaintenanceMode
            maintenance = MaintenanceMode.objects.get_instance()
            planned_end = maintenance.planned_end_time
        except Exception:
            planned_end = None
        
        context = {
            'maintenance_mode': True,
            'planned_end_time': planned_end,
        }
        
        # Используем шаблон из настроек
        template = getattr(settings, 'MAINTENANCE_MODE_TEMPLATE', 'maintenance/503.html')
        status_code = getattr(settings, 'MAINTENANCE_MODE_STATUS_CODE', 503)
        
        # Проверяем, хочет ли клиент JSON
        accept = request.META.get('HTTP_ACCEPT', '')
        if 'application/json' in accept.lower() or request.path.startswith('/api/'):
            response = JsonResponse(
                {'error': 'Service Unavailable', 'maintenance_mode': True},
                status=status_code
            )
        else:
            response = render(request, template, context, status=status_code)
        
        # Добавляем заголовки
        from django.utils.cache import add_never_cache_headers
        add_never_cache_headers(response)
        
        if planned_end:
            response['Retry-After'] = '3600'  # Можно вычислить точное время
        
        return response


def clear_maintenance_whitelist_cache():
    """
    Утилита для очистки кэша whitelist.
    Вызывать после обновления настроек в БД.
    """
    cache.delete(MaintenanceModeEnforcementMiddleware.CACHE_KEY)

