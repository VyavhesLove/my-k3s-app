"""Модель сессий пользователя для отслеживания активных сеансов."""
from django.db import models
from django.conf import settings


class UserSession(models.Model):
    """
    Модель для хранения информации о сессиях пользователя.
    Позволяет отслеживать активные сеансы и завершать их удалённо.
    """
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='sessions',
        verbose_name="Пользователь"
    )
    
    # Идентификатор токена (полный refresh токен)
    token_id = models.CharField(
        max_length=512,
        unique=True,
        verbose_name="ID токена"
    )
    
    # Информация об устройстве/браузере
    user_agent = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        verbose_name="User Agent"
    )
    
    # IP адрес
    ip_address = models.GenericIPAddressField(
        blank=True,
        null=True,
        verbose_name="IP адрес"
    )
    
    # Время создания и последней активности
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name="Время создания"
    )
    
    last_activity = models.DateTimeField(
        auto_now=True,
        verbose_name="Последняя активность"
    )
    
    # Активна ли сессия
    is_active = models.BooleanField(
        default=True,
        verbose_name="Активна"
    )
    
    # Описание (например, "Основной браузер", "Мобильное устройство")
    description = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        verbose_name="Описание"
    )

    class Meta:
        verbose_name = 'Сессия пользователя'
        verbose_name_plural = 'Сессии пользователей'
        ordering = ['-last_activity']

    def __str__(self):
        return f"{self.user.username} - {self.description or self.token_id[:8]}"

    @property
    def is_current(self):
        """Проверяет, является ли сессия текущей."""
        # Этот метод будет определяться по ID токена в запросе
        return False

