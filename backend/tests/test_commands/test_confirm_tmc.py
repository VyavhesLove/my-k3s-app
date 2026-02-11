"""Тесты для команды подтверждения ТМЦ (ConfirmItemCommand)."""
from django.test import TestCase
from django.contrib.auth import get_user_model
from items.models import Item, ItemHistory
from items.services.commands.confirm_item import ConfirmItemCommand
from items.enums import ItemStatus, HistoryAction
from items.services.domain.exceptions import DomainValidationError

User = get_user_model()


class ConfirmItemCommandTestCase(TestCase):
    """Тесты для ConfirmItemCommand."""

    def setUp(self):
        """Подготовка тестовых данных."""
        self.user = User.objects.create_user(
            username="storekeeper",
            password="123",
        )
        
        self.item = Item.objects.create(
            name="Laptop",
            status=ItemStatus.CONFIRM,
            location="Main warehouse",
        )
        
        self.command = ConfirmItemCommand()

    def test_confirm_item_success(self):
        """Успешное подтверждение ТМЦ."""
        # Act
        result = self.command.execute(
            item_id=self.item.id,
            comment="Принято на склад",
            user=self.user,
        )
        
        # Обновляем из БД
        self.item.refresh_from_db()
        
        # Assert
        self.assertEqual(result, self.item.id)
        self.assertEqual(self.item.status, ItemStatus.AVAILABLE)
        
        # Проверяем историю
        history = ItemHistory.objects.get(item=self.item)
        self.assertEqual(history.user, self.user)
        self.assertEqual(history.action_type, HistoryAction.CONFIRMED)

    def test_confirm_item_invalid_status(self):
        """Ошибка при попытке подтвердить ТМЦ с неверным статусом."""
        # Arrange
        self.item.status = ItemStatus.AVAILABLE
        self.item.save()
        
        # Act + Assert
        with self.assertRaises(DomainValidationError):
            self.command.execute(
                item_id=self.item.id,
                comment="Test comment",
                user=self.user,
            )
        
        # История НЕ должна быть создана
        self.assertEqual(
            ItemHistory.objects.filter(item=self.item).count(),
            0
        )

    def test_confirm_item_not_found(self):
        """Ошибка при несуществующем item_id."""
        with self.assertRaises(Item.DoesNotExist):
            self.command.execute(
                item_id=999,
                comment="Test comment",
                user=self.user,
            )

    def test_confirm_item_history_comment_format(self):
        """Проверка формата комментария в истории."""
        # Act
        self.command.execute(
            item_id=self.item.id,
            comment="Test comment",
            user=self.user,
        )
        
        # Assert
        history = ItemHistory.objects.get(item=self.item)
        self.assertIn("Test comment", history.action)

    def test_confirm_item_returns_id(self):
        """Проверка возвращаемого значения ID."""
        result = self.command.execute(
            item_id=self.item.id,
            comment="Test comment",
            user=self.user,
        )
        
        self.assertEqual(result, self.item.id)
        self.assertIsInstance(result, int)

    def test_confirm_item_unlocks_after_error(self):
        """Проверка что ТМЦ разблокируется после ошибки."""
        # Arrange
        self.item.status = ItemStatus.AVAILABLE
        self.item.save()
        
        # Act - пытаемся подтвердить с неверным статусом
        try:
            self.command.execute(
                item_id=self.item.id,
                comment="Test comment",
                user=self.user,
            )
        except DomainValidationError:
            pass
        
        # Assert - ТМЦ должен быть разблокирован
        self.item.refresh_from_db()
        self.assertIsNone(self.item.locked_by)
        self.assertIsNone(self.item.locked_at)

