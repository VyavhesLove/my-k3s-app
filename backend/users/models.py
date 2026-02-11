"""Роли пользователей для системы ТМЦ."""
from django.db import models


class UserRole(models.TextChoices):
    """Роли пользователей в системе."""
    ADMIN = "admin", "Администратор"
    STOREKEEPER = "storekeeper", "Кладовщик"
    BRIGADIER = "brigadier", "Бригадир"


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
        default=UserRole.BRIGADIER,
        verbose_name="Роль"
    )

    class Meta(AbstractUser.Meta):
        verbose_name = "Пользователь"
        verbose_name_plural = "Пользователи"

    def __str__(self):
        return f"{self.username} ({self.get_role_display()})"

