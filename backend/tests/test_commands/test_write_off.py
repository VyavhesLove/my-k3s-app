"""Тесты для команд списания и отмены списания ТМЦ."""
from decimal import Decimal
from datetime import date
from django.test import TestCase
from django.contrib.auth import get_user_model
from django.utils import timezone
from items.models import Item, WriteOffRecord, ItemHistory, Location
from items.services.commands.write_off import WriteOffCommand
from items.services.commands.cancel_write_off import CancelWriteOffCommand
from items.enums import ItemStatus, HistoryAction
from items.services.domain.exceptions import DomainValidationError, DomainConflictError

User = get_user_model()


class WriteOffCommandTestCase(TestCase):
    """Тесты для WriteOffCommand."""

    def setUp(self):
        """Подготовка тестовых данных."""
        self.user = User.objects.create_user(
            username="storekeeper",
            password="123",
        )
        
        self.item = Item.objects.create(
            name="Laptop Dell",
            serial="DL-12345",
            brand="Dell",
            status=ItemStatus.ISSUED,
            location="Main warehouse",
        )

    def test_write_off_success(self):
        """Успешное списание ТМЦ."""
        # Act
        item_id, record_id = WriteOffCommand.execute(
            item_id=self.item.id,
            invoice_number="INV-2024-001",
            repair_cost=Decimal("5000.00"),
            description="Списание в связи с износом",
            user=self.user,
        )
        
        # Обновляем из БД
        self.item.refresh_from_db()
        write_off_record = WriteOffRecord.objects.get(id=record_id)
        
        # Assert
        self.assertEqual(item_id, self.item.id)
        self.assertEqual(self.item.status, ItemStatus.WRITTEN_OFF)
        
        # Проверяем запись о списании
        self.assertEqual(write_off_record.item, self.item)
        self.assertEqual(write_off_record.invoice_number, "INV-2024-001")
        self.assertEqual(write_off_record.repair_cost, Decimal("5000.00"))
        self.assertEqual(write_off_record.description, "Списание в связи с износом")
        self.assertFalse(write_off_record.is_cancelled)
        
        # Проверяем историю - запись о списании
        history_write_off = ItemHistory.objects.filter(
            item=self.item,
            action_type=HistoryAction.WRITTEN_OFF
        ).first()
        self.assertIsNotNone(history_write_off)
        self.assertEqual(history_write_off.user, self.user)
        
        # Проверяем историю - смена статуса
        history_status = ItemHistory.objects.filter(
            item=self.item,
            action_type=HistoryAction.STATUS_CHANGED
        ).first()
        self.assertIsNotNone(history_status)
        self.assertEqual(history_status.payload['old_status'], ItemStatus.ISSUED)
        self.assertEqual(history_status.payload['new_status'], ItemStatus.WRITTEN_OFF)

    def test_write_off_from_at_work_status(self):
        """Списание ТМЦ из статуса AT_WORK."""
        # Arrange
        self.item.status = ItemStatus.AT_WORK
        self.item.save()
        
        # Act
        item_id, record_id = WriteOffCommand.execute(
            item_id=self.item.id,
            invoice_number="INV-2024-002",
            user=self.user,
        )
        
        # Assert
        self.item.refresh_from_db()
        self.assertEqual(self.item.status, ItemStatus.WRITTEN_OFF)
        self.assertEqual(item_id, self.item.id)

    def test_write_off_from_in_repair_status(self):
        """Списание ТМЦ из статуса IN_REPAIR."""
        # Arrange
        self.item.status = ItemStatus.IN_REPAIR
        self.item.save()
        
        # Act
        item_id, record_id = WriteOffCommand.execute(
            item_id=self.item.id,
            invoice_number="INV-2024-003",
            user=self.user,
        )
        
        # Assert
        self.item.refresh_from_db()
        self.assertEqual(self.item.status, ItemStatus.WRITTEN_OFF)
        self.assertEqual(item_id, self.item.id)

    def test_write_off_invalid_status_raises_error(self):
        """Ошибка при попытке списать ТМЦ в недопустимом статусе."""
        # Arrange - AVAILABLE не допускает списание
        self.item.status = ItemStatus.AVAILABLE
        self.item.save()
        
        # Act + Assert
        with self.assertRaises(DomainValidationError) as context:
            WriteOffCommand.execute(
                item_id=self.item.id,
                invoice_number="INV-2024-004",
                user=self.user,
            )
        
        self.assertIn("нельзя списать", str(context.exception))
        
        # История НЕ должна быть создана
        self.assertEqual(
            ItemHistory.objects.filter(item=self.item).count(),
            0
        )
        
        # Статус НЕ должен измениться
        self.item.refresh_from_db()
        self.assertEqual(self.item.status, ItemStatus.AVAILABLE)

    def test_write_off_duplicate_record_raises_error(self):
        """Ошибка при попытке повторного списания одного Item."""
        # Arrange - первый раз списываем
        WriteOffCommand.execute(
            item_id=self.item.id,
            invoice_number="INV-2024-001",
            user=self.user,
        )
        
        # Act + Assert - второй раз пытаемся списать тот же Item
        # После первого списания Item в статусе WRITTEN_OFF, поэтому:
        # - выбрасывается DomainConflictError "Item уже списан"
        # Это корректное поведение - нельзя списать уже списанный Item
        with self.assertRaises(DomainConflictError) as context:
            WriteOffCommand.execute(
                item_id=self.item.id,
                invoice_number="INV-2024-002",
                user=self.user,
            )
        
        # Проверяем, что ошибка содержит ожидаемый текст
        error_msg = str(context.exception)
        self.assertIn("Item уже списан", error_msg)

    def test_write_off_record_contains_correct_data(self):
        """Проверка, что WriteOffRecord создаётся с корректными данными."""
        # Act
        item_id, record_id = WriteOffCommand.execute(
            item_id=self.item.id,
            invoice_number="INV-2024-005",
            repair_cost=Decimal("1234.50"),
            date_to_service=date(2024, 1, 15),
            date_written_off=date(2024, 1, 20),
            description="Тестовое списание",
            user=self.user,
        )
        
        write_off_record = WriteOffRecord.objects.get(id=record_id)
        
        # Assert - проверяем Decimal
        self.assertEqual(write_off_record.repair_cost, Decimal("1234.50"))
        self.assertIsInstance(write_off_record.repair_cost, Decimal)
        self.assertEqual(str(write_off_record.repair_cost), "1234.50")
        
        # Проверяем даты
        self.assertEqual(write_off_record.date_to_service, date(2024, 1, 15))
        self.assertEqual(write_off_record.date_written_off, date(2024, 1, 20))
        
        # Проверяем остальные данные
        self.assertEqual(write_off_record.invoice_number, "INV-2024-005")
        self.assertEqual(write_off_record.description, "Тестовое списание")
        self.assertEqual(write_off_record.created_by, self.user)

    def test_write_off_decimal_precision(self):
        """Проверка, что Decimal 1234.50 не превращается в float."""
        # Act
        item_id, record_id = WriteOffCommand.execute(
            item_id=self.item.id,
            invoice_number="INV-2024-006",
            repair_cost=Decimal("1234.50"),
            user=self.user,
        )
        
        write_off_record = WriteOffRecord.objects.get(id=record_id)
        
        # Assert
        self.assertIsInstance(write_off_record.repair_cost, Decimal)
        # Проверяем точность - не должно быть 1234.5
        self.assertEqual(write_off_record.repair_cost, Decimal("1234.50"))
        self.assertEqual(str(write_off_record.repair_cost), "1234.50")

    def test_write_off_with_zero_repair_cost(self):
        """Списание с нулевой стоимостью ремонта."""
        # Act
        item_id, record_id = WriteOffCommand.execute(
            item_id=self.item.id,
            invoice_number="INV-2024-007",
            repair_cost=Decimal("0"),
            user=self.user,
        )
        
        write_off_record = WriteOffRecord.objects.get(id=record_id)
        
        # Assert
        self.assertEqual(write_off_record.repair_cost, Decimal("0"))

    def test_write_off_creates_location(self):
        """Проверка создания Location при списании Item с location."""
        # Arrange - создаём Item с уникальным location
        unique_location = "Unique Warehouse XYZ-123"
        item = Item.objects.create(
            name="Test Device",
            serial="TD-99999",
            status=ItemStatus.ISSUED,
            location=unique_location,
        )
        
        # Убеждаемся, что Location не существует
        self.assertFalse(Location.objects.filter(name=unique_location).exists())
        
        # Act
        item_id, record_id = WriteOffCommand.execute(
            item_id=item.id,
            invoice_number="INV-LOCATION-001",
            repair_cost=Decimal("500.00"),
            user=self.user,
        )
        
        # Assert
        write_off_record = WriteOffRecord.objects.get(id=record_id)
        
        # Проверяем, что Location был создан
        self.assertTrue(Location.objects.filter(name=unique_location).exists())
        
        # Проверяем, что WriteOffRecord ссылается на созданный Location
        self.assertIsNotNone(write_off_record.location)
        self.assertEqual(write_off_record.location.name, unique_location)

    def test_write_off_duplicate_record_check(self):
        """Проверка ошибки при наличии активной записи WriteOffRecord (строка 68)."""
        # Arrange - создаём Item С location чтобы код создал Location автоматически
        location_name = "Duplicate Warehouse LOC"
        item = Item.objects.create(
            name="Duplicate Test Item",
            serial="DT-77777",
            status=ItemStatus.ISSUED,
            location=location_name,
        )
        
        # Создаём Location заранее
        location = Location.objects.create(name=location_name)
        
        # Создаём активную запись WriteOffRecord вручную
        WriteOffRecord.objects.create(
            item=item,
            invoice_number="INV-EXISTING-001",
            repair_cost=Decimal("100.00"),
            date_to_service=date.today(),
            date_written_off=date.today(),
            created_by=self.user,
            location=location,
        )
        
        # Убеждаемся, что запись создана
        self.assertTrue(WriteOffRecord.objects.filter(item=item, is_cancelled=False).exists())
        
        # Act - теперь validate_write_off() НЕ упадёт (статус ISSUED допустим)
        # но проверка дубликата (строка 67-70) должна выбросить ошибку
        with self.assertRaises(DomainValidationError) as context:
            WriteOffCommand.execute(
                item_id=item.id,
                invoice_number="INV-NEW-001",
                user=self.user,
            )
        
        self.assertIn("уже имеет активную запись", str(context.exception))

    def test_write_off_returns_tuple(self):
        """Проверка, что execute возвращает кортеж (item_id, record_id)."""
        # Act
        result = WriteOffCommand.execute(
            item_id=self.item.id,
            invoice_number="INV-2024-008",
            user=self.user,
        )
        
        # Assert
        self.assertIsInstance(result, tuple)
        self.assertEqual(len(result), 2)
        self.assertEqual(result[0], self.item.id)
        self.assertIsInstance(result[0], int)
        self.assertIsInstance(result[1], int)

    def test_write_off_not_found(self):
        """Ошибка при несуществующем item_id."""
        with self.assertRaises(Item.DoesNotExist):
            WriteOffCommand.execute(
                item_id=999,
                invoice_number="INV-2024-009",
                user=self.user,
            )

    def test_write_off_history_action_type_and_text(self):
        """Проверка точных значений action_type и action_text в истории."""
        # Act
        WriteOffCommand.execute(
            item_id=self.item.id,
            invoice_number="INV-2024-010",
            repair_cost=Decimal("2500.00"),
            description="Списание по причине износа",
            user=self.user,
        )
        
        # Assert - проверяем запись WRITTEN_OFF
        history_write_off = ItemHistory.objects.filter(
            item=self.item,
            action_type=HistoryAction.WRITTEN_OFF
        ).first()
        self.assertIsNotNone(history_write_off)
        
        # Проверяем action_type
        self.assertEqual(history_write_off.action_type, HistoryAction.WRITTEN_OFF)
        
        # Проверяем action_text - должен содержать ключевые элементы
        self.assertIn("Списание ТМЦ", history_write_off.action)
        self.assertIn("износа", history_write_off.action)
        self.assertIn("2500.00", history_write_off.action)
        
        # Проверяем payload
        self.assertEqual(history_write_off.payload['reason'], "Списание по причине износа")
        self.assertEqual(history_write_off.payload['amount'], "2500.00")
        
        # Assert - проверяем запись STATUS_CHANGED
        history_status = ItemHistory.objects.filter(
            item=self.item,
            action_type=HistoryAction.STATUS_CHANGED
        ).first()
        self.assertIsNotNone(history_status)
        self.assertEqual(history_status.action_type, HistoryAction.STATUS_CHANGED)
        self.assertIn(ItemStatus.ISSUED, history_status.action)
        self.assertIn(ItemStatus.WRITTEN_OFF, history_status.action)
        self.assertEqual(history_status.payload['old_status'], ItemStatus.ISSUED)
        self.assertEqual(history_status.payload['new_status'], ItemStatus.WRITTEN_OFF)

    def test_write_off_after_cancel_success(self):
        """Успешное повторное списание после отмены предыдущего."""
        # Arrange - первый раз списываем
        WriteOffCommand.execute(
            item_id=self.item.id,
            invoice_number="INV-FIRST-001",
            user=self.user,
        )
        
        # Отменяем списание
        CancelWriteOffCommand.execute(item_id=self.item.id, user=self.user)
        
        # Проверяем что Item снова доступен
        self.item.refresh_from_db()
        self.assertEqual(self.item.status, ItemStatus.AVAILABLE)
        
        # Проверяем что старая запись о списании отменена
        old_record = WriteOffRecord.objects.filter(item=self.item).first()
        self.assertIsNotNone(old_record)
        self.assertTrue(old_record.is_cancelled)
        
        # NOTE: После отмены списания Item в статусе AVAILABLE.
        # Списание допустимо только из ISSUED, AT_WORK, IN_REPAIR.
        # Для повторного списания нужно сначала изменить статус на допустимый.
        # В этом тесте мы используем setUp который создаёт item в статусе ISSUED,
        # но после отмены списания он переходит в AVAILABLE.
        # Поэтому для повторного списания меняем статус на ISSUED.
        self.item.status = ItemStatus.ISSUED
        self.item.save()
        
        # Act - второй раз списываем тот же Item
        item_id, record_id = WriteOffCommand.execute(
            item_id=self.item.id,
            invoice_number="INV-SECOND-001",
            repair_cost=Decimal("1000.00"),
            user=self.user,
        )
        
        # Assert
        self.item.refresh_from_db()
        self.assertEqual(self.item.status, ItemStatus.WRITTEN_OFF)
        self.assertEqual(item_id, self.item.id)
        
        # Проверяем что создалась новая запись о списании
        new_record = WriteOffRecord.objects.filter(id=record_id).first()
        self.assertIsNotNone(new_record)
        self.assertEqual(new_record.invoice_number, "INV-SECOND-001")
        self.assertFalse(new_record.is_cancelled)


class CancelWriteOffCommandTestCase(TestCase):
    """Тесты для CancelWriteOffCommand."""

    def setUp(self):
        """Подготовка тестовых данных."""
        self.user = User.objects.create_user(
            username="storekeeper",
            password="123",
        )
        
        # Создаём Item в статусе ISSUED (допустимом для списания)
        self.item = Item.objects.create(
            name="Laptop Dell",
            serial="DL-12345",
            status=ItemStatus.ISSUED,
            location="Main warehouse",
        )
        
        # Создаём запись о списании - после этого Item перейдёт в WRITTEN_OFF
        _, self.record_id = WriteOffCommand.execute(
            item_id=self.item.id,
            invoice_number="INV-2024-001",
            repair_cost=Decimal("5000.00"),
            user=self.user,
        )

    def test_cancel_write_off_success(self):
        """Успешная отмена списания."""
        # Act
        result = CancelWriteOffCommand.execute(
            item_id=self.item.id,
            user=self.user,
        )
        
        # Обновляем из БД
        self.item.refresh_from_db()
        write_off_record = WriteOffRecord.objects.get(id=self.record_id)
        
        # Assert
        self.assertEqual(result, self.item.id)
        self.assertEqual(self.item.status, ItemStatus.AVAILABLE)
        
        # Проверяем, что запись о списании отменена
        self.assertTrue(write_off_record.is_cancelled)
        self.assertIsNotNone(write_off_record.cancelled_at)

    def test_cancel_write_off_non_written_off_raises_error(self):
        """Ошибка при попытке отменить списание для Item не в статусе WRITTEN_OFF."""
        # Arrange - создаём отдельный Item в статусе ISSUED (не списываем его)
        item = Item.objects.create(
            name="Other Laptop",
            serial="OT-99999",
            status=ItemStatus.ISSUED,
            location="Other warehouse",
        )
        
        # Act + Assert
        with self.assertRaises(DomainValidationError) as context:
            CancelWriteOffCommand.execute(
                item_id=item.id,
                user=self.user,
            )
        
        self.assertIn("имеет статус", str(context.exception))
        self.assertIn(ItemStatus.ISSUED, str(context.exception))

    def test_cancel_write_off_without_record_raises_error(self):
        """Ошибка при попытке отменить несуществующую запись о списании."""
        # Arrange - удаляем запись о списании
        WriteOffRecord.objects.filter(item=self.item).delete()
        
        # Act + Assert
        with self.assertRaises(DomainValidationError) as context:
            CancelWriteOffCommand.execute(
                item_id=self.item.id,
                user=self.user,
            )
        
        self.assertIn("не имеет активной записи", str(context.exception))

    def test_cancel_write_off_is_cancelled_flag(self):
        """Проверка установки флага is_cancelled."""
        # Act
        CancelWriteOffCommand.execute(
            item_id=self.item.id,
            user=self.user,
        )
        
        write_off_record = WriteOffRecord.objects.get(id=self.record_id)
        
        # Assert
        self.assertTrue(write_off_record.is_cancelled)

    def test_cancel_write_off_cancelled_at_set(self):
        """Проверка установки поля cancelled_at."""
        # Act
        CancelWriteOffCommand.execute(
            item_id=self.item.id,
            user=self.user,
        )
        
        write_off_record = WriteOffRecord.objects.get(id=self.record_id)
        
        # Assert
        self.assertIsNotNone(write_off_record.cancelled_at)

    def test_cancel_write_off_status_change(self):
        """Проверка смены статуса WRITTEN_OFF → AVAILABLE."""
        # Act
        CancelWriteOffCommand.execute(
            item_id=self.item.id,
            user=self.user,
        )
        
        self.item.refresh_from_db()
        
        # Assert
        self.assertEqual(self.item.status, ItemStatus.AVAILABLE)

    def test_cancel_write_off_history(self):
        """Проверка создания истории при отмене списания."""
        # Arrange - создаём отдельный Item для этого теста
        item = Item.objects.create(
            name="History Test Laptop",
            serial="HT-88888",
            status=ItemStatus.ISSUED,
            location="History warehouse",
        )
        
        # Списываем Item
        _, record_id = WriteOffCommand.execute(
            item_id=item.id,
            invoice_number="INV-HISTORY-001",
            repair_cost=Decimal("1000.00"),
            user=self.user,
        )
        
        # Запоминаем время до отмены списания
        before_cancel = timezone.now() if hasattr(timezone, 'now') else datetime.now()
        
        # Act - отменяем списание
        CancelWriteOffCommand.execute(
            item_id=item.id,
            user=self.user,
        )
        
        # Проверяем историю - отмена списания
        history_cancel = ItemHistory.objects.filter(
            item=item,
            action_type=HistoryAction.CANCELLED_WRITE_OFF
        ).first()
        self.assertIsNotNone(history_cancel)
        self.assertEqual(history_cancel.user, self.user)
        
        # Проверяем историю - смена статуса при отмене списания
        # Фильтруем записи STATUS_CHANGED, созданные после отмены списания
        history_status_all = ItemHistory.objects.filter(
            item=item,
            action_type=HistoryAction.STATUS_CHANGED
        ).order_by('-timestamp')
        
        # Последняя запись STATUS_CHANGED должна быть отмена списания
        history_status = history_status_all.first()
        self.assertIsNotNone(history_status)
        self.assertEqual(history_status.payload['old_status'], ItemStatus.WRITTEN_OFF)
        self.assertEqual(history_status.payload['new_status'], ItemStatus.AVAILABLE)

    def test_cancel_write_off_returns_id(self):
        """Проверка возвращаемого значения ID."""
        result = CancelWriteOffCommand.execute(
            item_id=self.item.id,
            user=self.user,
        )
        
        self.assertEqual(result, self.item.id)
        self.assertIsInstance(result, int)

    def test_cancel_write_off_history_action_type_and_text(self):
        """Проверка точных значений action_type и action_text в истории при отмене."""
        # Arrange
        write_off_record_id = self.record_id
        
        # Act
        CancelWriteOffCommand.execute(
            item_id=self.item.id,
            user=self.user,
        )
        
        # Assert - проверяем запись CANCELLED_WRITE_OFF
        history_cancel = ItemHistory.objects.filter(
            item=self.item,
            action_type=HistoryAction.CANCELLED_WRITE_OFF
        ).first()
        self.assertIsNotNone(history_cancel)
        
        # Проверяем action_type
        self.assertEqual(history_cancel.action_type, HistoryAction.CANCELLED_WRITE_OFF)
        
        # Проверяем action_text
        self.assertIn("Отмена списания ТМЦ", history_cancel.action)
        self.assertIn(str(write_off_record_id), history_cancel.action)
        
        # Проверяем payload
        self.assertEqual(history_cancel.payload['write_off_id'], str(write_off_record_id))
        
        # Assert - проверяем запись STATUS_CHANGED
        history_status = ItemHistory.objects.filter(
            item=self.item,
            action_type=HistoryAction.STATUS_CHANGED
        ).order_by('-timestamp').first()
        self.assertIsNotNone(history_status)
        self.assertEqual(history_status.action_type, HistoryAction.STATUS_CHANGED)
        self.assertEqual(history_status.payload['old_status'], ItemStatus.WRITTEN_OFF)
        self.assertEqual(history_status.payload['new_status'], ItemStatus.AVAILABLE)

    def test_cancel_write_off_not_found(self):
        """Ошибка при несуществующем item_id."""
        with self.assertRaises(Item.DoesNotExist):
            CancelWriteOffCommand.execute(
                item_id=999,
                user=self.user,
            )


class WriteOffTransactionTestCase(TestCase):
    """Тесты на конкурентность транзакций.
    
    TODO: до миграции на PostgreSQL - SQLite не поддерживает select_for_update()
    в многопоточном режиме, поэтому эти тесты будут падать с "database table is locked".
    Раскомментировать после перехода на PostgreSQL.
    """
    pass
    # def setUp(self):
    #     """Подготовка тестовых данных."""
    #     self.user = User.objects.create_user(
    #         username="storekeeper",
    #         password="123",
    #     )
    #     
    #     self.item = Item.objects.create(
    #         name="Laptop Dell",
    #         serial="DL-12345",
    #         status=ItemStatus.ISSUED,
    #         location="Main warehouse",
    #     )
    #
    # def test_concurrent_write_off_second_fails(self):
    #     """Второй поток должен упасть с DomainValidationError при конкурентном списании."""
    #     errors = []
    #     results = []
    #     barrier = threading.Barrier(2)
    #     
    #     def write_off_thread(thread_id):
    #         try:
    #             # Синхронизируем старт обоих потоков
    #             barrier.wait()
    #             
    #             item_id, record_id = WriteOffCommand.execute(
    #                 item_id=self.item.id,
    #                 invoice_number=f"INV-2024-{thread_id}",
    #                 user=self.user,
    #             )
    #             results.append((thread_id, item_id, record_id))
    #         except DomainValidationError as e:
    #             errors.append((thread_id, str(e)))
    #         except Exception as e:
    #             errors.append((thread_id, f"Unexpected: {type(e).__name__}: {e}"))
    #     
    #     # Запускаем два потока
    #     t1 = threading.Thread(target=write_off_thread, args=(1,))
    #     t2 = threading.Thread(target=write_off_thread, args=(2,))
    #     
    #     t1.start()
    #     t2.start()
    #     
    #     t1.join()
    #     t2.join()
    #     
    #     # Assert
    #     # Только один поток должен успешно выполнить списание
    #     self.assertEqual(len(results), 1)
    #     self.assertEqual(len(errors), 1)
    #     
    #     # Один из потоков должен получить ошибку
    #     error_thread_id, error_msg = errors[0]
    #     self.assertIn("уже имеет активную запись", error_msg)
    #     
    #     # Успешный поток должен получить правильный результат
    #     thread_id, item_id, record_id = results[0]
    #     self.assertEqual(item_id, self.item.id)
    #     
    #     # Item должен быть в статусе WRITTEN_OFF
    #     self.item.refresh_from_db()
    #     self.assertEqual(self.item.status, ItemStatus.WRITTEN_OFF)
    #
    # def test_concurrent_write_off_different_items(self):
    #     """Два потока могут списать разные Items одновременно."""
    #     # Создаём второй Item
    #     item2 = Item.objects.create(
    #         name="Laptop HP",
    #         serial="HP-67890",
    #         status=ItemStatus.ISSUED,
    #         location="Main warehouse",
    #     )
    #     
    #     errors = []
    #     results = []
    #     barrier = threading.Barrier(2)
    #     
    #     def write_off_thread(thread_id, item_id):
    #         try:
    #             barrier.wait()
    #             item_id_result, record_id = WriteOffCommand.execute(
    #                 item_id=item_id,
    #                 invoice_number=f"INV-2024-{thread_id}",
    #                 user=self.user,
    #             )
    #             results.append((thread_id, item_id_result, record_id))
    #         except DomainValidationError as e:
    #             errors.append((thread_id, str(e)))
    #     
    #     # Запускаем два потока для разных items
    #     t1 = threading.Thread(target=write_off_thread, args=(1, self.item.id))
    #     t2 = threading.Thread(target=write_off_thread, args=(2, item2.id))
    #     
    #     t1.start()
    #     t2.start()
    #     
    #     t1.join()
    #     t2.join()
    #     
    #     # Assert - оба потока должны успешно выполнить списание
    #     self.assertEqual(len(results), 2)
    #     self.assertEqual(len(errors), 0)
    #     
    #     # Оба Items должны быть в статусе WRITTEN_OFF
    #     self.item.refresh_from_db()
    #     item2.refresh_from_db()
    #     self.assertEqual(self.item.status, ItemStatus.WRITTEN_OFF)
    #     self.assertEqual(item2.status, ItemStatus.WRITTEN_OFF)

