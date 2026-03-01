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
from django.utils import timezone


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


class MaintenanceModeManager(models.Manager):
    """
    Менеджер для работы с singleton-записью MaintenanceMode.
    Гарантирует, что в таблице всегда только одна запись с id=1.
    """
    
    def get_instance(self):
        """
        Получить или создать единственную запись MaintenanceMode.
        Всегда использует pk=1 для гарантии singleton.
        """
        obj, created = self.get_or_create(
            pk=1,
            defaults={'enabled': False, 'planned_end_time': None}
        )
        return obj


class MaintenanceMode(models.Model):
    """
    Модель для хранения состояния режима обслуживания.
    Singleton - всегда должна быть только одна запись в БД.
    """
    enabled = models.BooleanField(
        default=False,
        verbose_name="Режим обслуживания включён"
    )
    planned_end_time = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name="Планируемое время завершения"
    )
    updated_at = models.DateTimeField(
        auto_now=True,
        verbose_name="Дата обновления"
    )

    objects = MaintenanceModeManager()

    class Meta:
        verbose_name = "Режим обслуживания"
        verbose_name_plural = "Режимы обслуживания"

    def __str__(self):
        status = "включён" if self.enabled else "выключен"
        if self.planned_end_time:
            return f"Режим обслуживания: {status} (до {self.planned_end_time})"
        return f"Режим обслуживания: {status}"

    def is_active(self):
        """
        Проверить, активен ли режим обслуживания.
        Примечание: автоотключение при истечении времени централизовано в maintenance_backend.
        """
        if not self.enabled:
            return False
        # Проверяем, не истекло ли запланированное время
        if self.planned_end_time and self.planned_end_time < timezone.now():
            return False
        return True


# Импорт модели сессий для избежания циклических импортов
# Модель UserSession определена в models_session.py
default_app_config = 'users.apps.UsersConfig'

