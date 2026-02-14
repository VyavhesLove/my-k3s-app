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
        
        # Проверяем историю - фильтруем только по action_type=CONFIRMED
        # (LockService.locked() создаёт отдельную запись)
        history = ItemHistory.objects.get(item=self.item, action_type=HistoryAction.CONFIRMED)
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
        
        # Assert - фильтруем по action_type=CONFIRMED
        history = ItemHistory.objects.get(item=self.item, action_type=HistoryAction.CONFIRMED)
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

    def test_confirm_item_creates_status_history(self):
        """Проверка что создаётся история смены статуса."""
        # Act
        self.command.execute(
            item_id=self.item.id,
            comment="Test comment",
            user=self.user,
        )
        
        # Assert - проверяем историю смены статуса
        history_status = ItemHistory.objects.filter(
            item=self.item,
            action_type=HistoryAction.STATUS_CHANGED
        ).first()
        
        self.assertIsNotNone(history_status)
        self.assertEqual(history_status.payload['old_status'], ItemStatus.CONFIRM)
        self.assertEqual(history_status.payload['new_status'], ItemStatus.AVAILABLE)

