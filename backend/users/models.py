"""Роли пользователей для системы ТМЦ."""
from django.db import models


class UserRole(models.TextChoices):
    """Роли пользователей в системе."""
    ADMIN = "admin", "Администратор"
    STOREKEEPER = "storekeeper", "Кладовщик"
    FOREMAN = "foreman", "Бригадир"


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

