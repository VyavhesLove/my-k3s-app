"""
Интеграционные тесты для API подтверждения ТМЦ.

Покрывает:
- Успешное принятие/отклонение ТМЦ
- 403 для неправильной роли (бригадир)
- 400 при неверном статусе
- 404 при несуществующем item
"""
from rest_framework.test import APITestCase
from django.contrib.auth import get_user_model
from items.models import Item, ItemHistory, Location
from items.enums import ItemStatus, HistoryAction
from users.models import UserRole

User = get_user_model()


class ConfirmTMCAPITestCase(APITestCase):
    """Интеграционные тесты для ConfirmTMC API."""

    def setUp(self):
        """Подготовка тестовых данных."""
        # Создаём кладовщика
        self.storekeeper = User.objects.create_user(
            username="keeper",
            password="123",
            role=UserRole.STOREKEEPER
        )
        
        # Создаём бригадира (для тестов 403)
        self.foreman = User.objects.create_user(
            username="foreman",
            password="123",
            role=UserRole.FOREMAN
        )
        
        # Создаём админа (должен иметь доступ)
        self.admin = User.objects.create_user(
            username="admin",
            password="123",
            role=UserRole.ADMIN
        )
        
        # Создаём локацию для теста отклонения
        self.location = Location.objects.create(name="Test Location")
        
        # Создаём ТМЦ для тестирования
        self.item = Item.objects.create(
            name="Test Laptop",
            serial="SN12345",
            brand="Dell",
            status=ItemStatus.CREATED,
            location="Warehouse"
        )

    def test_confirm_tmc_success_accept(self):
        """Успешное принятие ТМЦ кладовщиком."""
        # Аутентифицируемся как кладовщик
        self.client.force_authenticate(self.storekeeper)
        
        # Отправляем запрос на принятие (pk=self.item.id)
        response = self.client.post(
            f"/api/items/{self.item.id}/confirm-tmc/",
            {"action": "accept"},
            format="json"
        )
        
        # Проверяем ответ
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["success"], True)
        
        # Проверяем изменения в базе
        self.item.refresh_from_db()
        self.assertEqual(self.item.status, ItemStatus.AVAILABLE)
        self.assertEqual(self.item.responsible, self.storekeeper.username)

    def test_confirm_tmc_success_reject(self):
        """Успешное отклонение ТМЦ кладовщиком."""
        # Сначала создаём историю для возможности отклонения
        # (требуется первое назначение для восстановления)
        ItemHistory.objects.create(
            item=self.item,
            action_type=HistoryAction.ASSIGNED,
            location=self.location,
            user=self.storekeeper
        )
        
        # Меняем статус на confirm для возможности отклонения
        self.item.status = ItemStatus.CONFIRM
        self.item.save()
        
        # Аутентифицируемся как кладовщик
        self.client.force_authenticate(self.storekeeper)
        
        # Отправляем запрос на отклонение
        response = self.client.post(
            f"/api/items/{self.item.id}/confirm-tmc/",
            {"action": "reject"},
            format="json"
        )
        
        # Проверяем ответ
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["success"], True)
        
        # Проверяем изменения в базе
        self.item.refresh_from_db()
        self.assertEqual(self.item.status, ItemStatus.ISSUED)

    def test_confirm_tmc_admin_has_access(self):
        """Администратор имеет доступ к API подтверждения ТМЦ."""
        self.client.force_authenticate(self.admin)
        
        response = self.client.post(
            f"/api/items/{self.item.id}/confirm-tmc/",
            {"action": "accept"},
            format="json"
        )
        
        self.assertEqual(response.status_code, 200)
        self.item.refresh_from_db()
        self.assertEqual(self.item.status, ItemStatus.AVAILABLE)

    def test_confirm_tmc_forbidden_for_foreman(self):
        """403 для бригадира - нет доступа к подтверждению ТМЦ."""
        self.client.force_authenticate(self.foreman)
        
        response = self.client.post(
            f"/api/items/{self.item.id}/confirm-tmc/",
            {"action": "accept"},
            format="json"
        )
        
        self.assertEqual(response.status_code, 403)

    def test_confirm_tmc_invalid_status_returns_400(self):
        """400 при попытке подтвердить ТМЦ с неверным статусом."""
        # Статус AVAILABLE нельзя подтвердить (CREATED -> AVAILABLE)
        self.item.status = ItemStatus.AVAILABLE
        self.item.save()
        
        self.client.force_authenticate(self.storekeeper)
        
        response = self.client.post(
            f"/api/items/{self.item.id}/confirm-tmc/",
            {"action": "accept"},
            format="json"
        )
        
        self.assertEqual(response.status_code, 400)

    def test_confirm_tmc_not_found_returns_404(self):
        """404 при запросе несуществующего item."""
        self.client.force_authenticate(self.storekeeper)
        
        response = self.client.post(
            "/api/items/99999/confirm-tmc/",
            {"action": "accept"},
            format="json"
        )
        
        self.assertEqual(response.status_code, 404)

    def test_confirm_tmc_unauthenticated_returns_401(self):
        """401 для неаутентифицированного пользователя."""
        response = self.client.post(
            f"/api/items/{self.item.id}/confirm-tmc/",
            {"action": "accept"},
            format="json"
        )
        
        self.assertEqual(response.status_code, 401)

    def test_confirm_tmc_invalid_action_returns_400(self):
        """400 при невалидном действии."""
        self.client.force_authenticate(self.storekeeper)
        
        response = self.client.post(
            f"/api/items/{self.item.id}/confirm-tmc/",
            {"action": "invalid_action"},
            format="json"
        )
        
        self.assertEqual(response.status_code, 400)


class ConfirmItemAPITestCase(APITestCase):
    """Интеграционные тесты для confirm_item API (статус confirm -> available)."""

    def setUp(self):
        """Подготовка тестовых данных."""
        self.storekeeper = User.objects.create_user(
            username="keeper",
            password="123",
            role=UserRole.STOREKEEPER
        )
        
        # ТМЦ со статусом CONFIRM (требует подтверждения)
        self.item = Item.objects.create(
            name="Test Item",
            status=ItemStatus.CONFIRM,
            location="Warehouse"
        )

    def test_confirm_item_success(self):
        """Успешное подтверждение ТМЦ."""
        self.client.force_authenticate(self.storekeeper)
        
        response = self.client.post(
            f"/api/items/{self.item.id}/confirm/",
            {"comment": "Принято на склад"},
            format="json"
        )
        
        self.assertEqual(response.status_code, 200)
        
        self.item.refresh_from_db()
        self.assertEqual(self.item.status, ItemStatus.AVAILABLE)

    def test_confirm_item_forbidden_for_foreman(self):
        """403 для бригадира."""
        foreman = User.objects.create_user(
            username="foreman",
            password="123",
            role=UserRole.FOREMAN
        )
        self.client.force_authenticate(foreman)
        
        response = self.client.post(
            f"/api/items/{self.item.id}/confirm/",
            {"comment": "Test"},
            format="json"
        )
        
        self.assertEqual(response.status_code, 403)

    def test_confirm_item_invalid_status_returns_400(self):
        """400 при неверном статусе."""
        self.item.status = ItemStatus.AVAILABLE
        self.item.save()
        
        self.client.force_authenticate(self.storekeeper)
        
        response = self.client.post(
            f"/api/items/{self.item.id}/confirm/",
            {"comment": "Test"},
            format="json"
        )
        
        self.assertEqual(response.status_code, 400)

    def test_confirm_item_not_found_returns_404(self):
        """404 при несуществующем item."""
        self.client.force_authenticate(self.storekeeper)
        
        response = self.client.post(
            "/api/items/99999/confirm/",
            {"comment": "Test"},
            format="json"
        )
        
        self.assertEqual(response.status_code, 404)

