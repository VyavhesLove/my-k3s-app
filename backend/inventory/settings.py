"""
Django settings for inventory project.
"""

import os
from pathlib import Path
from datetime import timedelta

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = os.environ.get('DJANGO_SECRET_KEY', 'django-insecure-dev-key-change-in-prod')

DEBUG = os.environ.get('DJANGO_DEBUG', 'True') == 'True'

ALLOWED_HOSTS = ['*']

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'corsheaders',
    'rest_framework',
    'django_filters',
    'drf_spectacular',
    'auditlog',
    'maintenance_mode',
    'users',
    'items',
]

# REST_FRAMEWORK = {
#     'DEFAULT_SCHEMA_CLASS': 'drf_spectacular.openapi.AutoSchema',
# }

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'users.authentication.SessionAwareJWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticated', # Теперь всё закрыто по умолчанию!
    ),
    'DEFAULT_SCHEMA_CLASS': 'drf_spectacular.openapi.AutoSchema',
    'EXCEPTION_HANDLER': 'items.exceptions.custom_exception_handler',
    'DEFAULT_FILTER_BACKENDS': [
        'django_filters.rest_framework.DjangoFilterBackend',
        'rest_framework.filters.SearchFilter',
        'rest_framework.filters.OrderingFilter',
    ],
}

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=60),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=1),
    'AUTH_HEADER_TYPES': ('Bearer',),
}

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    # Кастомный middleware для проверки роли admin и разрешённых IP/URL
    # Полностью заменяет стандартный maintenance_mode.middleware.MaintenanceModeMiddleware
    'users.middleware.MaintenanceModeEnforcementMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'inventory.urls'

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': '/data/inventory.db',
    }
}

CORS_ALLOW_ALL_ORIGINS = True

# Ensure trailing slashes are added
APPEND_SLASH = True

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# Static files configuration
STATIC_URL = '/static/'
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [os.path.join(BASE_DIR, 'templates')],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
                'maintenance_mode.context_processors.maintenance_mode',
                'users.context_processors.maintenance_mode_context',
            ],
        },
    },
]

# CSRF and Proxy settings for K8s/Ingress
CSRF_TRUSTED_ORIGINS = [
    'http://k8s.local',
    'http://localhost',
    'http://127.0.0.1',
]

# Кастомная модель пользователя с ролями
AUTH_USER_MODEL = 'users.User'

SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
USE_X_FORWARDED_HOST = True
USE_X_FORWARDED_PORT = True

# Logging for container debugging
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '{levelname} {asctime} {module} {process:d} {thread:d} {message}',
            'style': '{',
        },
    },
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
            'formatter': 'verbose',
        },
    },
    'loggers': {
        'django': {
            'handlers': ['console'],
            'level': 'INFO',
        },
        'items': {
            'handlers': ['console'],
            'level': 'DEBUG',
        },
    },
}

# timezone поддержка
USE_TZ = True

# часовой пояс (Екатеринбург +5)
TIME_ZONE = 'Asia/Yekaterinburg'

# django-auditlog настройки
AUDITLOG_USE_TZ = True  # Использовать часовой пояс для записей аудита

# django-maintenance-mode настройки
MAINTENANCE_MODE = False  # по умолчанию выключен

# Использовать кастомный backend для хранения в БД
MAINTENANCE_MODE_STATE_BACKEND = 'users.maintenance_backend.DatabaseBackend'

# URL для отображения во время обслуживания
MAINTENANCE_MODE_TEMPLATE = 'maintenance/503.html'

# Разрешённые IP (whitelist)
MAINTENANCE_MODE_IPS = []

# Разрешённые пользователи (whitelist по username)
MAINTENANCE_MODE_USERS = ['admin']  # admin всегда имеет доступ

# Разрешённые URL (regex)
MAINTENANCE_MODE_URLS = []

# Имя файла для хранения состояния (не используется при кастомном backend)
MAINTENANCE_MODE_STATE_FILE_NAME = 'maintenance_mode.lock'
