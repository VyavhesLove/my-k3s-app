"""Тесты для permission классов системы ТМЦ.

Покрывает:
- Разрешённые роли (должен вернуть True)
- Запрещённые роли (должен вернуть False)
- Анонимный пользователь (должен вернуть False)
"""
from django.test import TestCase
from rest_framework.test import APIRequestFactory
from django.contrib.auth import get_user_model
from items.permissions import (
    IsStorekeeper,
    IsAdmin,
    IsForeman,
    IsAdminOrStorekeeper,
    IsAdminOrForeman,
    IsAuthenticatedWithRole,
)
from users.models import UserRole

User = get_user_model()


class IsStorekeeperPermissionTestCase(TestCase):
    """Тесты для IsStorekeeper."""

    def setUp(self):
        self.factory = APIRequestFactory()
        self.permission = IsStorekeeper()

    def test_storekeeper_allowed(self):
        """Кладовщик должен иметь доступ."""
        user = User.objects.create_user(
            username="keeper",
            password="123",
            role=UserRole.STOREKEEPER,
        )
        request = self.factory.get("/")
        request.user = user
        self.assertTrue(self.permission.has_permission(request, None))

    def test_admin_allowed(self):
        """Администратор должен иметь доступ (все права)."""
        user = User.objects.create_user(
            username="admin",
            password="123",
            role=UserRole.ADMIN,
        )
        request = self.factory.get("/")
        request.user = user
        self.assertTrue(self.permission.has_permission(request, None))

    def test_foreman_denied(self):
        """Бригадир должен быть denied."""
        user = User.objects.create_user(
            username="foreman",
            password="123",
            role=UserRole.FOREMAN,
        )
        request = self.factory.get("/")
        request.user = user
        self.assertFalse(self.permission.has_permission(request, None))

    def test_anonymous_denied(self):
        """Анонимный пользователь должен быть denied."""
        request = self.factory.get("/")
        request.user = None
        self.assertFalse(self.permission.has_permission(request, None))

    def test_unauthenticated_denied(self):
        """Неаутентифицированный пользователь должен быть denied."""
        from unittest.mock import Mock
        request = self.factory.get("/")
        request.user = Mock(spec=['is_authenticated'], is_authenticated=False)
        self.assertFalse(self.permission.has_permission(request, None))


class IsAdminPermissionTestCase(TestCase):
    """Тесты для IsAdmin."""

    def setUp(self):
        self.factory = APIRequestFactory()
        self.permission = IsAdmin()

    def test_admin_allowed(self):
        """Администратор должен иметь доступ."""
        user = User.objects.create_user(
            username="admin",
            password="123",
            role=UserRole.ADMIN,
        )
        request = self.factory.get("/")
        request.user = user
        self.assertTrue(self.permission.has_permission(request, None))

    def test_storekeeper_denied(self):
        """Кладовщик должен быть denied."""
        user = User.objects.create_user(
            username="keeper",
            password="123",
            role=UserRole.STOREKEEPER,
        )
        request = self.factory.get("/")
        request.user = user
        self.assertFalse(self.permission.has_permission(request, None))

    def test_foreman_denied(self):
        """Бригадир должен быть denied."""
        user = User.objects.create_user(
            username="foreman",
            password="123",
            role=UserRole.FOREMAN,
        )
        request = self.factory.get("/")
        request.user = user
        self.assertFalse(self.permission.has_permission(request, None))

    def test_anonymous_denied(self):
        """Анонимный пользователь должен быть denied."""
        request = self.factory.get("/")
        request.user = None
        self.assertFalse(self.permission.has_permission(request, None))


class IsForemanPermissionTestCase(TestCase):
    """Тесты для IsForeman."""

    def setUp(self):
        self.factory = APIRequestFactory()
        self.permission = IsForeman()

    def test_foreman_allowed(self):
        """Бригадир должен иметь доступ."""
        user = User.objects.create_user(
            username="foreman",
            password="123",
            role=UserRole.FOREMAN,
        )
        request = self.factory.get("/")
        request.user = user
        self.assertTrue(self.permission.has_permission(request, None))

    def test_admin_allowed(self):
        """Администратор должен иметь доступ (все права)."""
        user = User.objects.create_user(
            username="admin",
            password="123",
            role=UserRole.ADMIN,
        )
        request = self.factory.get("/")
        request.user = user
        self.assertTrue(self.permission.has_permission(request, None))

    def test_storekeeper_denied(self):
        """Кладовщик должен быть denied."""
        user = User.objects.create_user(
            username="keeper",
            password="123",
            role=UserRole.STOREKEEPER,
        )
        request = self.factory.get("/")
        request.user = user
        self.assertFalse(self.permission.has_permission(request, None))

    def test_anonymous_denied(self):
        """Анонимный пользователь должен быть denied."""
        request = self.factory.get("/")
        request.user = None
        self.assertFalse(self.permission.has_permission(request, None))


class IsAdminOrStorekeeperPermissionTestCase(TestCase):
    """Тесты для IsAdminOrStorekeeper."""

    def setUp(self):
        self.factory = APIRequestFactory()
        self.permission = IsAdminOrStorekeeper()

    def test_admin_allowed(self):
        """Администратор должен иметь доступ."""
        user = User.objects.create_user(
            username="admin",
            password="123",
            role=UserRole.ADMIN,
        )
        request = self.factory.get("/")
        request.user = user
        self.assertTrue(self.permission.has_permission(request, None))

    def test_storekeeper_allowed(self):
        """Кладовщик должен иметь доступ."""
        user = User.objects.create_user(
            username="keeper",
            password="123",
            role=UserRole.STOREKEEPER,
        )
        request = self.factory.get("/")
        request.user = user
        self.assertTrue(self.permission.has_permission(request, None))

    def test_foreman_denied(self):
        """Бригадир должен быть denied."""
        user = User.objects.create_user(
            username="foreman",
            password="123",
            role=UserRole.FOREMAN,
        )
        request = self.factory.get("/")
        request.user = user
        self.assertFalse(self.permission.has_permission(request, None))

    def test_anonymous_denied(self):
        """Анонимный пользователь должен быть denied."""
        request = self.factory.get("/")
        request.user = None
        self.assertFalse(self.permission.has_permission(request, None))


class IsAdminOrForemanPermissionTestCase(TestCase):
    """Тесты для IsAdminOrForeman."""

    def setUp(self):
        self.factory = APIRequestFactory()
        self.permission = IsAdminOrForeman()

    def test_admin_allowed(self):
        """Администратор должен иметь доступ."""
        user = User.objects.create_user(
            username="admin",
            password="123",
            role=UserRole.ADMIN,
        )
        request = self.factory.get("/")
        request.user = user
        self.assertTrue(self.permission.has_permission(request, None))

    def test_foreman_allowed(self):
        """Бригадир должен иметь доступ."""
        user = User.objects.create_user(
            username="foreman",
            password="123",
            role=UserRole.FOREMAN,
        )
        request = self.factory.get("/")
        request.user = user
        self.assertTrue(self.permission.has_permission(request, None))

    def test_storekeeper_denied(self):
        """Кладовщик должен быть denied."""
        user = User.objects.create_user(
            username="keeper",
            password="123",
            role=UserRole.STOREKEEPER,
        )
        request = self.factory.get("/")
        request.user = user
        self.assertFalse(self.permission.has_permission(request, None))

    def test_anonymous_denied(self):
        """Анонимный пользователь должен быть denied."""
        request = self.factory.get("/")
        request.user = None
        self.assertFalse(self.permission.has_permission(request, None))


class IsAuthenticatedWithRolePermissionTestCase(TestCase):
    """Тесты для IsAuthenticatedWithRole."""

    def setUp(self):
        self.factory = APIRequestFactory()
        self.permission = IsAuthenticatedWithRole()

    def test_admin_allowed(self):
        """Администратор должен иметь доступ."""
        user = User.objects.create_user(
            username="admin",
            password="123",
            role=UserRole.ADMIN,
        )
        request = self.factory.get("/")
        request.user = user
        self.assertTrue(self.permission.has_permission(request, None))

    def test_storekeeper_allowed(self):
        """Кладовщик должен иметь доступ."""
        user = User.objects.create_user(
            username="keeper",
            password="123",
            role=UserRole.STOREKEEPER,
        )
        request = self.factory.get("/")
        request.user = user
        self.assertTrue(self.permission.has_permission(request, None))

    def test_foreman_allowed(self):
        """Бригадир должен иметь доступ."""
        user = User.objects.create_user(
            username="foreman",
            password="123",
            role=UserRole.FOREMAN,
        )
        request = self.factory.get("/")
        request.user = user
        self.assertTrue(self.permission.has_permission(request, None))

    def test_anonymous_denied(self):
        """Анонимный пользователь должен быть denied."""
        request = self.factory.get("/")
        request.user = None
        self.assertFalse(self.permission.has_permission(request, None))

    def test_user_without_role_denied(self):
        """Пользователь без роли должен быть denied."""
        from unittest.mock import Mock
        request = self.factory.get("/")
        request.user = Mock(
            spec=['is_authenticated', 'role'],
            is_authenticated=True,
            role=None
        )
        self.assertFalse(self.permission.has_permission(request, None))

