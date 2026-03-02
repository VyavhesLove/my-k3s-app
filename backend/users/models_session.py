"""Модель сессий пользователя для отслеживания активных сеансов."""
from django.db import models
from django.conf import settings
from django.utils import timezone
from uuid import uuid4


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
    
    # UUID сессии - уникальный идентификатор для валидации через access token
    session_uuid = models.UUIDField(
        unique=True,
        default=uuid4,
        db_index=True,
        verbose_name="UUID сессии"
    )
    
    # Идентификатор токена (полный refresh токен) - для обратной совместимости
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
        return f"{self.user.username} - {self.description or str(self.session_uuid)[:8]}"

    @property
    def is_current(self):
        """Проверяет, является ли сессия текущей."""
        # Этот метод будет определяться по ID токена в запросе
        return False


class TokenBlacklist(models.Model):
    """
    Модель для хранения отозванных JWT токенов.
    Используется для принудительного завершения сессий пользователей.
    """
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='blacklisted_tokens',
        verbose_name="Пользователь"
    )
    
    # Refresh токен, который был отозван
    token = models.TextField(
        verbose_name="Refresh токен"
    )
    
    # Время добавления в blacklist
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name="Время добавления"
    )
    
    # Время истечения токена (для автоматической очистки)
    expires_at = models.DateTimeField(
        verbose_name="Время истечения токена"
    )
    
    # Причина отзыва
    reason = models.CharField(
        max_length=100,
        default='admin_terminated',
        verbose_name="Причина"
    )

    class Meta:
        verbose_name = 'Отозванный токен'
        verbose_name_plural = 'Отозванные токены'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'created_at']),
            models.Index(fields=['expires_at']),
        ]

    def __str__(self):
        return f"Blacklisted token for {self.user.username}"

    @classmethod
    def is_blacklisted(cls, token):
        """Проверяет, находится ли токен в blacklist."""
        # Сначала удаляем просроченные токены
        cls.cleanup()
        
        return cls.objects.filter(
            token=token,
            expires_at__gt=timezone.now()
        ).exists()

    @classmethod
    def add_to_blacklist(cls, user, token, reason='admin_terminated'):
        """
        Добавляет токен в blacklist.
        Вычисляет время истечения на основе REFRESH_TOKEN_LIFETIME.
        """
        from datetime import timedelta
        from django.conf import settings
        
        # Получаем время жизни refresh токена из настроек
        token_lifetime = getattr(settings, 'SIMPLE_JWT', {}).get(
            'REFRESH_TOKEN_LIFETIME',
            timedelta(days=1)
        )
        
        expires_at = timezone.now() + token_lifetime
        
        cls.objects.create(
            user=user,
            token=token,
            expires_at=expires_at,
            reason=reason
        )

    @classmethod
    def cleanup(cls):
        """Удаляет просроченные токены из blacklist."""
        cls.objects.filter(expires_at__lte=timezone.now()).delete()

