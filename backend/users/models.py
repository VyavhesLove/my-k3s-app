"""Роли пользователей для системы ТМЦ."""
from django.conf import settings
from django.db import models


class UserRole(models.TextChoices):
    """Роли пользователей в системе."""
    ADMIN = "admin", "Администратор"
    STOREKEEPER = "storekeeper", "Кладовщик"
    FOREMAN = "foreman", "Бригадир"


class LoginErrorStatus(models.TextChoices):
    """Статусы ошибок при входе."""
    INVALID_PASSWORD = "invalid_password", "Неверный пароль"
    INVALID_USERNAME = "invalid_username", "Неверный логин"
    USER_BLOCKED = "user_blocked", "Пользователь заблокирован"
    USER_INACTIVE = "user_inactive", "Пользователь неактивен"
    BANNED = "banned_on_5min", "Заблокирован на 5 минут (превышено количество попыток)"
    UNKNOWN = "unknown", "Неизвестная ошибка"


"""Кастомная модель User с полем роли."""
from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    """
    Кастомная модель пользователя.
    
    Добавлено поле role для разграничения прав доступа:
    - admin: полный доступ
    - storekeeper: кладовщик (может подтверждать ТМЦ)
    - brigadier: бригадир
    """
    role = models.CharField(
        max_length=20,
        choices=UserRole.choices,
        default=UserRole.FOREMAN,
        db_index=True,
        verbose_name="Роль"
    )
    surname = models.CharField(
        max_length=150,
        blank=True,
        verbose_name="Отчество"
    )
    active = models.BooleanField(
        default=True,
        verbose_name="Активен"
    )

    class Meta(AbstractUser.Meta):
        verbose_name = "Пользователь"
        verbose_name_plural = "Пользователи"

    def __str__(self):
        return f"{self.username} ({self.get_role_display()})"

    # Helper-методы для проверки ролей
    def is_admin(self) -> bool:
        return str(self.role) == 'admin'

    def is_storekeeper(self) -> bool:
        return str(self.role) == 'storekeeper'

    def is_foreman(self) -> bool:
        return str(self.role) == 'foreman'


# Импорт модели сессий для избежания циклических импортов
# Модель UserSession определена в models_session.py
default_app_config = 'users.apps.UsersConfig'


class LoginLog(models.Model):
    """
    Модель для логирования входов пользователей.
    Записывает дату/время входа, логин, результат и причину ошибки (если есть).
    """
    timestamp = models.DateTimeField(
        auto_now_add=True,
        verbose_name="Время входа"
    )
    
    username = models.CharField(
        max_length=150,
        verbose_name="Логин пользователя"
    )
    
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='login_logs',
        verbose_name="Пользователь"
    )
    
    success = models.BooleanField(
        verbose_name="Успешный вход"
    )
    
    error_status = models.CharField(
        max_length=30,
        choices=LoginErrorStatus.choices,
        blank=True,
        null=True,
        verbose_name="Статус ошибки"
    )
    
    ip_address = models.GenericIPAddressField(
        blank=True,
        null=True,
        verbose_name="IP адрес"
    )
    
    user_agent = models.CharField(
        max_length=255,
        blank=True,
        verbose_name="User Agent"
    )

    class Meta:
        verbose_name = 'Лог входов'
        verbose_name_plural = 'Логи входов'
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['-timestamp']),
            models.Index(fields=['username']),
            models.Index(fields=['user', '-timestamp']),
        ]

    def __str__(self):
        status = "✓" if self.success else "✗"
        return f"{status} {self.timestamp} - {self.username}"

