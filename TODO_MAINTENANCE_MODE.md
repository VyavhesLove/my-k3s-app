# TODO: Внедрение django-maintenance-mode и кастомной модели сессий

## Цель
Внедрить режим обслуживания с кастомной страницей 503 и создать кастомную модель сессий на базе AbstractBaseSession.

## Анализ текущего состояния

### ⚠️ Ключевые исправления (обязательно к изучению!)

1. **Модель сессий**: `app_label = 'django_session'` в Meta (НЕ `db_table = 'user_sessions'`)
2. **SESSION_ENGINE**: Обязательно добавить в settings.py
3. **Middleware порядок**: MaintenanceModeMiddleware ПОСЛЕ AuthenticationMiddleware
4. **Менеджер**: Использовать `session_key__ne` вместо `exclude()`, добавить проверку `is_authenticated`
5. **Шаблон 503**: Добавить проверку `{% if request.user.is_staff %}` для whitelist
6. **API endpoints**: Обязательно добавить toggle_maintenance и user_sessions

### Что уже есть:
1. ✅ Django проект настроен в `my-k3s-app/backend/`
2. ✅ `settings.py` - основные настройки
3. ✅ Модель `User` с ролями (admin, storekeeper, foreman)
4. ✅ Существующая `UserSession` модель в `users/models_session.py` (расширенная версия)

### Что нужно сделать:
1. Установить django-maintenance-mode
2. Создать кастомную модель сессий на базе AbstractBaseSession
3. Настроить maintenance mode в settings
4. Создать шаблон 503 страницы
5. Настроить whitelist (IP/пользователи)

---

## План выполнения

### Этап 1: Установка зависимостей

- [ ] 1.1 Установить django-maintenance-mode: `pip install django-maintenance-mode`
- [ ] 1.2 Добавить в requirements.txt

### Этап 2: Создание кастомной модели сессий (AbstractBaseSession)

- [ ] 2.1 Создать файл `users/models_custom_session.py`
- [ ] 2.2 Определить класс `CustomSession(AbstractBaseSession)`:
  ```python
  from django.contrib.sessions.base_sessions import AbstractBaseSession
  from django.contrib.auth import get_user_model
  from django.db import models

  User = get_user_model()

  class CustomSession(AbstractBaseSession):
      """Кастомная модель сессий на базе AbstractBaseSession."""
      user = models.ForeignKey(User, null=True, blank=True, 
                             on_delete=models.CASCADE, related_name='sessions')
      ip_address = models.GenericIPAddressField(null=True, blank=True)
      user_agent = models.CharField(max_length=255, blank=True, null=True)
      
      class Meta(AbstractBaseSession.Meta):
          app_label = 'django_session'  # КРИТИЧНО! Не использовать db_table!
  ```
- [ ] 2.3 Обновить `users/__init__.py` для использования новой модели
- [ ] 2.4 Добавить менеджер с методами:
  - `terminate_all(user)` - завершить все сессии пользователя
  - `terminate_except_current(request)` - завершить все кроме текущей
  - `get_user_sessions(user)` - получить все активные сессии пользователя

### Этап 3: Настройка django-maintenance-mode в settings.py

- [ ] 3.1 Добавить 'maintenance_mode' в INSTALLED_APPS

- [ ] 3.2 **ОБЯЗАТЕЛЬНО** добавить настройки сессий:
  ```python
  SESSION_ENGINE = 'django.contrib.sessions.backends.db'
  SESSION_SERIALIZER = 'django.contrib.sessions.serializers.JSONSerializer'
  ```

- [ ] 3.3 Настройка middleware (порядок КРИТИЧЕН!):
  ```python
  MIDDLEWARE = [
      # ... стандартные
      'django.contrib.sessions.middleware.SessionMiddleware',  # ДО
      'django.contrib.auth.middleware.AuthenticationMiddleware',  # ДО
      'maintenance_mode.middleware.MaintenanceModeMiddleware',  # ← ПОСЛЕ Authentication!
      # ... остальное
  ]
  ```

- [ ] 3.4 Добавить настройки MAINTENANCE_MODE:
  ```python
  MAINTENANCE_MODE = False  # по умолчанию выключен
  
  # URL для отображения во время обслуживания
  MAINTENANCE_MODE_TEMPLATE = 'maintenance/503.html'
  
  # Разрешённые IP (whitelist)
  MAINTENANCE_MODE_IPS = []
  
  # Разрешённые пользователи (whitelist по username)
  MAINTENANCE_MODE_USERS = []
  
  # Разрешённые URL (regex)
  MAINTENANCE_MODE_URLS = []
  
  # Использовать DB для хранения состояния
  MAINTENANCE_MODE_USE_DB = True
  
  # Использовать Redis (если есть)
  MAINTENANCE_MODE_USE_REDIS = False
  ```

### Этап 4: Создание шаблона 503 страницы

- [ ] 4.1 Создать директорию `templates/maintenance/`
- [ ] 4.2 Создать файл `templates/maintenance/503.html`:
  ```html
  {% load static %}
  <!DOCTYPE html>
  <html lang="ru">
  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>{% block title %}Техническое обслуживание{% endblock %}</title>
      <style>
          body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
          h1 { color: #e74c3c; }
          p { color: #7f8c8d; }
          .whitelist-notice { background: #d4edda; color: #155724; padding: 15px; border-radius: 5px; }
      </style>
  </head>
  <body>
      <div class="maintenance">
          <h1>🔧 Техническое обслуживание</h1>
          
          {% if request.user.is_staff %}
              <div class="whitelist-notice">
                  <p>Вы в whitelist. <a href="{% url 'admin:index' %}">Админка</a></p>
              </div>
          {% else %}
              <p>Сайт временно недоступен.</p>
              <p>Пожалуйста, вернитесь позже.</p>
          {% endif %}
      </div>
  </body>
  </html>
  ```

### Этап 5: API для управления режимом обслуживания

- [ ] 5.1 Создать endpoint для включения/выключения maintenance mode
- [ ] 5.2 Добавить представление в `users/views/maintenance.py`
- [ ] 5.3 Добавить URL в `users/urls.py`:
  ```python
  path('api/admin/maintenance/toggle/', toggle_maintenance, name='toggle-maintenance'),
  ```

### Этап 6: Миграции

- [ ] 6.1 Создать миграции: `python manage.py makemigrations`
- [ ] 6.2 Применить миграции: `python manage.py migrate`

### Этап 7: Тестирование

- [ ] 7.1 Тест включения maintenance mode через settings
- [ ] 7.2 Тест доступа для whitelist IP
- [ ] 7.3 Тест доступа для whitelist пользователя (admin)
- [ ] 7.4 Тест кастомной 503 страницы
- [ ] 7.5 Тест модели CustomSession

### Этап 8: Admin для сессий

- [ ] 8.1 Обновить `users/admin.py` с кастомным SessionAdmin
- [ ] 8.2 Перерегистрировать Session модель

### Этап 9: Views для управления сессиями

- [ ] 9.1 Создать `users/views/sessions.py`
- [ ] 9.2 Добавить URL в `users/urls.py`

---

## Технические детали

### Кастомная модель сессий (правильная версия):

```python
from django.contrib.sessions.base_sessions import AbstractBaseSession
from django.contrib.auth import get_user_model
from django.db import models

User = get_user_model()


class CustomSession(AbstractBaseSession):
    """Кастомная модель сессий на базе AbstractBaseSession."""
    user = models.ForeignKey(User, null=True, blank=True, 
                           on_delete=models.CASCADE, related_name='sessions')
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.CharField(max_length=255, blank=True, null=True)
    
    class Meta(AbstractBaseSession.Meta):
        app_label = 'django_session'  # КРИТИЧНО! Не использовать db_table!
```

### Менеджер с методами управления сессиями:

```python
from django.utils import timezone


class CustomSessionManager(models.Manager):
    """Менеджер для управления сессиями."""
    
    def get_user_sessions(self, user):
        """Получить все активные сессии пользователя."""
        return self.filter(
            user=user,
            expire_date__gte=timezone.now()
        ).order_by('-expire_date')
    
    def terminate_all(self, user):
        """Завершить все сессии пользователя."""
        return self.filter(user=user).delete()
    
    def terminate_except_current(self, request):
        """Завершить все сессии пользователя, кроме текущей."""
        if not request.user.is_authenticated:
            return 0
        session_key = request.session.session_key
        return self.filter(
            user=request.user,
            session_key__ne=session_key  # используем __ne вместо exclude
        ).delete()
```

### Интеграция менеджера в модель:

```python
class CustomSession(AbstractBaseSession):
    objects = CustomSessionManager()  # ← ДОБАВИТЬ менеджер
    
    user = models.ForeignKey(User, null=True, blank=True, 
                           on_delete=models.CASCADE, related_name='sessions')
    # ... остальные поля
```

### Интеграция с Admin:

```python
# users/admin.py
from django.contrib.sessions.admin import SessionAdmin
from django.contrib.sessions.models import Session
from django.contrib import admin


class CustomSessionAdmin(SessionAdmin):
    """Кастомная админка для сессий."""
    list_display = ['session_key', 'user', 'ip_address', 'expire_date']
    list_filter = ['user', 'expire_date']
    search_fields = ['user__username', 'ip_address', 'session_key']


# Перерегистрируем Session с кастомной админкой
admin.site.unregister(Session)
admin.site.register(Session, CustomSessionAdmin)
```

### API endpoint для toggle maintenance mode:

```python
# users/views/maintenance.py
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAdminUser
from rest_framework.response import Response


@api_view(['POST'])
@permission_classes([IsAdminUser])
def toggle_maintenance(request):
    """
    Включить/выключить режим обслуживания.
    """
    from maintenance_mode.models import MaintenanceMode
    
    # Получаем текущее состояние
    current = MaintenanceMode.objects.first()
    
    if current:
        new_state = not current.enabled
        current.enabled = new_state
        current.save()
    else:
        # Создаём запись если её нет
        MaintenanceMode.objects.create(enabled=True)
        new_state = True
    
    return Response({'maintenance_mode': new_state})
```

### Views для управления сессиями:

```python
# users/views/sessions.py
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response


@api_view(['GET', 'POST', 'DELETE'])
@permission_classes([IsAuthenticated])
def user_sessions(request):
    """
    Управление сессиями пользователя.
    GET - получить список сессий
    POST - завершить сессии (action: terminate_all, terminate_except_current)
    """
    from .models_custom_session import CustomSession
    
    if request.method == 'GET':
        sessions = CustomSession.objects.get_user_sessions(request.user)
        return Response([
            {
                'key': s.session_key,
                'ip': s.ip_address,
                'user_agent': s.user_agent,
                'expire_date': s.expire_date,
            }
            for s in sessions
        ])
    
    if request.method == 'POST':
        action = request.data.get('action')
        
        if action == 'terminate_all':
            CustomSession.objects.terminate_all(request.user)
        elif action == 'terminate_except_current':
            CustomSession.objects.terminate_except_current(request)
        
        return Response({'status': 'ok'})
```

### URL для API:

```python
# users/urls.py
from .views.maintenance import toggle_maintenance
from .views.sessions import user_sessions

urlpatterns = [
    # ... другие url
    path('api/admin/maintenance/toggle/', toggle_maintenance, name='toggle-maintenance'),
    path('api/user/sessions/', user_sessions, name='user-sessions'),
]

---

## Варианты хранения флага maintenance mode

1. **settings.py** - простой вариант, для разработки
2. **База данных** - через модель, требует миграции
3. **Файл** - `maintenance_mode.lock` в корне проекта
4. **Redis** - для кластера (требует настройки Redis)

Рекомендуется использовать DB (MAINTENANCE_MODE_USE_DB = True) для возможности управления через API.

---

## Как это работает

```
1. MAINTENANCE_MODE = True в settings
2. MaintenanceModeMiddleware проверяет:
   - IP в whitelist? -> разрешить
   - User в whitelist? -> разрешить
   - URL в whitelist? -> редирект
3. Иначе -> показать 503.html
```

---

## Результаты тестирования (заполняется после реализации)

- [ ] Тест 1: 
- [ ] Тест 2: 
- [ ] Тест 3: 

