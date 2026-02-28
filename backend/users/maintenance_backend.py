"""
Кастомный backend для django-maintenance-mode с использованием БД.
Позволяет хранить состояние режима обслуживания в базе данных,
включая запланированное время завершения работ.
"""

from django.core.cache import cache
from django.utils import timezone
from maintenance_mode.backends import AbstractStateBackend


class DatabaseBackend(AbstractStateBackend):
    """
    Backend для хранения состояния maintenance mode в базе данных.
    """
    
    CACHE_KEY = 'maintenance_mode_state'
    CACHE_TIMEOUT = 60  # 1 минута
    
    def get_value(self):
        """
        Получить текущее состояние режима обслуживания.
        """
        # Пробуем получить из кэша
        cached_value = cache.get(self.CACHE_KEY)
        if cached_value is not None:
            return cached_value
        
        # Получаем из базы данных
        from .models import MaintenanceMode
        
        try:
            maintenance = MaintenanceMode.objects.first()
            if maintenance and maintenance.enabled:
                # Проверяем, не истекло ли запланированное время
                if maintenance.planned_end_time and maintenance.planned_end_time < timezone.now():
                    # Время вышло - автоматически выключаем режим
                    maintenance.enabled = False
                    maintenance.save()
                    cache.set(self.CACHE_KEY, False, self.CACHE_TIMEOUT)
                    return False
                cache.set(self.CACHE_KEY, True, self.CACHE_TIMEOUT)
                return True
        except Exception:
            pass
        
        cache.set(self.CACHE_KEY, False, self.CACHE_TIMEOUT)
        return False
    
    def set_value(self, value):
        """
        Установить состояние режима обслуживания.
        """
        from .models import MaintenanceMode
        
        maintenance, created = MaintenanceMode.objects.get_or_create(
            defaults={'enabled': False, 'planned_end_time': None}
        )
        maintenance.enabled = bool(value)
        maintenance.save()
        
        # Обновляем кэш
        cache.set(self.CACHE_KEY, bool(value), self.CACHE_TIMEOUT)
    
    def get_maintenance_info(self):
        """
        Получить полную информацию о режиме обслуживания.
        """
        from .models import MaintenanceMode
        
        try:
            maintenance = MaintenanceMode.objects.first()
            if maintenance:
                return {
                    'enabled': maintenance.enabled,
                    'planned_end_time': maintenance.planned_end_time,
                }
        except Exception:
            pass
        
        return {
            'enabled': False,
            'planned_end_time': None,
        }
    
    def set_maintenance_with_time(self, enabled, planned_end_time=None):
        """
        Установить режим обслуживания с запланированным временем завершения.
        """
        from .models import MaintenanceMode
        
        maintenance, created = MaintenanceMode.objects.get_or_create(
            defaults={'enabled': False, 'planned_end_time': None}
        )
        maintenance.enabled = bool(enabled)
        if planned_end_time:
            maintenance.planned_end_time = planned_end_time
        else:
            maintenance.planned_end_time = None
        maintenance.save()
        
        # Обновляем кэш
        cache.set(self.CACHE_KEY, bool(enabled), self.CACHE_TIMEOUT)

