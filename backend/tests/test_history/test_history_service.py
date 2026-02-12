"""Тесты для HistoryService - сервиса создания записей истории ТМЦ."""
from django.test import TestCase
from django.contrib.auth import get_user_model
from items.models import Item, ItemHistory, Location
from items.enums import ItemStatus, HistoryAction, HistoryActionTemplates
from items.services.history_service import HistoryService

User = get_user_model()


class HistoryServiceTestCase(TestCase):
    """Базовый класс тестов для HistoryService."""

    def setUp(self):
        """Подготовка тестовых данных."""
        self.user = User.objects.create_user(
            username="test_user",
            password="test123"
        )
        self.item = Item.objects.create(
            name="Test Laptop",
            serial="SN12345",
            status=ItemStatus.CREATED
        )

    def _get_history_for_item(self):
        """Получить историю для текущего item."""
        return ItemHistory.objects.filter(item=self.item).first()


class HistoryServiceCreateTestCase(HistoryServiceTestCase):
    """Тесты для метода create()."""

    def test_create_basic_record(self):
        """Создание базовой записи истории с payload."""
        payload = {"location": "Main warehouse"}
        history = HistoryService.create(
            item=self.item,
            action_type=HistoryAction.ACCEPTED,
            user=self.user,
            payload=payload
        )

        self.assertIsNotNone(history)
        self.assertEqual(history.item, self.item)
        self.assertEqual(history.user, self.user)
        self.assertEqual(history.action_type, HistoryAction.ACCEPTED)
        self.assertIn("Main warehouse", history.action)
        self.assertIn("принято", history.action)

    def test_create_without_user(self):
        """Создание записи без пользователя."""
        payload = {}
        history = HistoryService.create(
            item=self.item,
            action_type=HistoryAction.CONFIRMED,
            user=None,
            payload=payload
        )

        self.assertIsNotNone(history)
        self.assertIsNone(history.user)
        self.assertIn("подтверждено", history.action)

    def test_create_without_location(self):
        """Создание записи без локации."""
        payload = {}
        history = HistoryService.create(
            item=self.item,
            action_type=HistoryAction.ACCEPTED,
            user=self.user,
            payload=payload
        )

        self.assertIsNotNone(history)
        self.assertIn("принято", history.action)

    def test_create_with_payload(self):
        """Создание записи с payload."""
        payload = {"old_status": "created", "new_status": "available"}
        history = HistoryService.create(
            item=self.item,
            action_type=HistoryAction.STATUS_CHANGED,
            payload=payload,
            user=self.user
        )

        self.assertIsNotNone(history)
        self.assertEqual(history.payload, payload)
        self.assertIn("created", history.action)
        self.assertIn("available", history.action)
        self.assertIn("→", history.action)

    def test_create_with_comment(self):
        """Создание записи с комментарием."""
        # comment в create() - это отдельный параметр, не в payload
        history = HistoryService.create(
            item=self.item,
            action_type=HistoryAction.UPDATED,
            user=self.user,
            comment="Тестовый комментарий"
        )

        self.assertIsNotNone(history)
        self.assertEqual(history.comment, "Тестовый комментарий")

    def test_create_location_auto_created(self):
        """Локация создаётся автоматически если не существует."""
        location_name = "New Location 12345"
        history = HistoryService.create(
            item=self.item,
            action_type=HistoryAction.ACCEPTED,
            user=self.user,
            location_name=location_name
        )

        # Проверяем что локация была создана
        self.assertIsNotNone(history.location)
        self.assertEqual(history.location.name, location_name)
        
        # Проверяем что она теперь существует в базе
        location_exists = Location.objects.filter(name=location_name).exists()
        self.assertTrue(location_exists)

    def test_create_existing_location_reused(self):
        """Существующая локация переиспользуется."""
        existing_location = Location.objects.create(name="Existing Warehouse")
        
        history = HistoryService.create(
            item=self.item,
            action_type=HistoryAction.ACCEPTED,
            user=self.user,
            location_name="Existing Warehouse"
        )

        self.assertEqual(history.location.id, existing_location.id)


class HistoryServiceAcceptedTestCase(HistoryServiceTestCase):
    """Тесты для метода accepted()."""

    def test_accepted_with_location(self):
        """Принятие ТМЦ с указанием локации."""
        history = HistoryService.accepted(
            item=self.item,
            user=self.user,
            location="Main warehouse"
        )

        self.assertIsNotNone(history)
        self.assertEqual(history.user, self.user)
        self.assertEqual(history.action_type, HistoryAction.ACCEPTED)
        self.assertIn("Main warehouse", history.action)
        self.assertIn("принято", history.action)

    def test_accepted_uses_item_location(self):
        """Принятие ТМЦ использует локацию из item если не указана."""
        self.item.location = "Warehouse B"
        self.item.save()

        history = HistoryService.accepted(
            item=self.item,
            user=self.user,
            location=None
        )

        self.assertIsNotNone(history)
        self.assertIn("Warehouse B", history.action)
        self.assertIn("принято", history.action)

    def test_accepted_without_location(self):
        """Принятие ТМЦ без локации."""
        history = HistoryService.accepted(
            item=self.item,
            user=self.user,
            location=None
        )

        self.assertIsNotNone(history)
        self.assertIn("принято", history.action)


class HistoryServiceRejectedTestCase(HistoryServiceTestCase):
    """Тесты для метода rejected()."""

    def test_rejected_with_location(self):
        """Отклонение ТМЦ с указанием локации."""
        history = HistoryService.rejected(
            item=self.item,
            user=self.user,
            location="Main warehouse"
        )

        self.assertEqual(history.action_type, HistoryAction.REJECTED)
        self.assertIn("Main warehouse", history.action)
        self.assertIn("принято", history.action)

    def test_rejected_uses_item_location(self):
        """Отклонение использует локацию из item."""
        self.item.location = "Object A"
        self.item.save()

        history = HistoryService.rejected(
            item=self.item,
            user=self.user,
            location=None
        )

        self.assertIn("Object A", history.action)


class HistoryServiceSentToServiceTestCase(HistoryServiceTestCase):
    """Тесты для метода sent_to_service()."""

    def test_sent_to_service_basic(self):
        """Отправка в сервис."""
        reason = "Не включается"
        history = HistoryService.sent_to_service(
            item=self.item,
            user=self.user,
            reason=reason
        )

        self.assertEqual(history.action_type, HistoryAction.SENT_TO_SERVICE)
        self.assertIn(reason, history.action)
        self.assertIn("сервис", history.action)

    def test_sent_to_service_with_custom_location(self):
        """Отправка в сервис с указанием локации."""
        history = HistoryService.sent_to_service(
            item=self.item,
            user=self.user,
            reason="Ремонт",
            location="Service center"
        )

        self.assertEqual(history.location.name, "Service center")
        self.assertIn("сервис", history.action)


class HistoryServiceReturnedFromServiceTestCase(HistoryServiceTestCase):
    """Тесты для метода returned_from_service()."""

    def test_returned_from_service_basic(self):
        """Возврат из сервиса."""
        history = HistoryService.returned_from_service(
            item=self.item,
            user=self.user
        )

        self.assertEqual(history.action_type, HistoryAction.RETURNED_FROM_SERVICE)
        self.assertIn("Возвращено", history.action)
        self.assertIn("сервис", history.action)

    def test_returned_from_service_with_location(self):
        """Возврат из сервиса с локацией."""
        history = HistoryService.returned_from_service(
            item=self.item,
            user=self.user,
            location="Main warehouse"
        )

        self.assertEqual(history.location.name, "Main warehouse")


class HistoryServiceStatusChangedTestCase(HistoryServiceTestCase):
    """Тесты для метода status_changed()."""

    def test_status_changed_basic(self):
        """Смена статуса."""
        history = HistoryService.status_changed(
            item=self.item,
            user=self.user,
            old_status=ItemStatus.CREATED,
            new_status=ItemStatus.AVAILABLE
        )

        self.assertEqual(history.action_type, HistoryAction.STATUS_CHANGED)
        self.assertIn("created", history.action)
        self.assertIn("available", history.action)
        self.assertIn("→", history.action)

    def test_status_changed_with_location(self):
        """Смена статуса с локацией."""
        history = HistoryService.status_changed(
            item=self.item,
            user=self.user,
            old_status="old",
            new_status="new",
            location="Warehouse"
        )

        self.assertEqual(history.location.name, "Warehouse")


class HistoryServiceLockedTestCase(HistoryServiceTestCase):
    """Тесты для метода locked()."""

    def test_locked_basic(self):
        """Блокировка ТМЦ."""
        history = HistoryService.locked(
            item=self.item,
            user=self.user
        )

        self.assertEqual(history.action_type, HistoryAction.LOCKED)
        self.assertIn(self.user.username, history.action)
        self.assertIn("Заблокировано", history.action)

    def test_locked_with_location(self):
        """Блокировка с локацией."""
        history = HistoryService.locked(
            item=self.item,
            user=self.user,
            location="Main warehouse"
        )

        self.assertEqual(history.location.name, "Main warehouse")


class HistoryServiceUpdatedTestCase(HistoryServiceTestCase):
    """Тесты для метода updated()."""

    def test_updated_basic(self):
        """Обновление информации."""
        history = HistoryService.updated(
            item=self.item,
            user=self.user
        )

        self.assertEqual(history.action_type, HistoryAction.UPDATED)
        self.assertIn("Обновление", history.action)

    def test_updated_with_comment(self):
        """Обновление с комментарием."""
        comment = "Обновлены технические характеристики"
        history = HistoryService.updated(
            item=self.item,
            user=self.user,
            comment=comment
        )

        self.assertEqual(history.comment, comment)
        self.assertIn(comment, history.action)

    def test_updated_with_location(self):
        """Обновление с локацией."""
        history = HistoryService.updated(
            item=self.item,
            user=self.user,
            location="Warehouse A"
        )

        self.assertEqual(history.location.name, "Warehouse A")


class HistoryServiceAssignedTestCase(HistoryServiceTestCase):
    """Тесты для метода assigned()."""

    def test_assigned_basic(self):
        """Распределение ТМЦ."""
        history = HistoryService.assigned(
            item=self.item,
            user=self.user
        )

        self.assertEqual(history.action_type, HistoryAction.ASSIGNED)
        self.assertIn("распределено", history.action)

    def test_assigned_with_location(self):
        """Распределение с локацией."""
        location_name = "Brigade A warehouse"
        history = HistoryService.assigned(
            item=self.item,
            user=self.user,
            location=location_name
        )

        self.assertEqual(history.location.name, location_name)


class HistoryServiceRepairConfirmedTestCase(HistoryServiceTestCase):
    """Тесты для метода repair_confirmed()."""

    def test_repair_confirmed_basic(self):
        """Подтверждение ремонта."""
        history = HistoryService.repair_confirmed(
            item=self.item,
            user=self.user
        )

        self.assertEqual(history.action_type, HistoryAction.REPAIR_CONFIRMED)
        self.assertIn("Ремонт", history.action)
        self.assertIn("подтверждён", history.action)

    def test_repair_confirmed_with_location(self):
        """Подтверждение ремонта с локацией."""
        history = HistoryService.repair_confirmed(
            item=self.item,
            user=self.user,
            location="Main warehouse"
        )

        self.assertEqual(history.location.name, "Main warehouse")


class HistoryServiceUnlockedTestCase(HistoryServiceTestCase):
    """Тесты для метода unlocked()."""

    def test_unlocked_basic(self):
        """Разблокировка ТМЦ."""
        history = HistoryService.unlocked(
            item=self.item,
            user=self.user
        )

        self.assertEqual(history.action_type, HistoryAction.UNLOCKED)
        self.assertIn("Разблокировано", history.action)

    def test_unlocked_with_location(self):
        """Разблокировка с локацией."""
        history = HistoryService.unlocked(
            item=self.item,
            user=self.user,
            location="Office"
        )

        self.assertEqual(history.location.name, "Office")


class HistoryServiceConfirmedTestCase(HistoryServiceTestCase):
    """Тесты для метода confirmed()."""

    def test_confirmed_basic(self):
        """Подтверждение ТМЦ."""
        history = HistoryService.confirmed(
            item=self.item,
            user=self.user
        )

        self.assertEqual(history.action_type, HistoryAction.CONFIRMED)
        self.assertIn("подтверждено", history.action)

    def test_confirmed_with_comment(self):
        """Подтверждение с комментарием."""
        comment = "Проверено и принято"
        history = HistoryService.confirmed(
            item=self.item,
            user=self.user,
            comment=comment
        )

        self.assertEqual(history.comment, comment)
        self.assertIn(comment, history.action)

    def test_confirmed_with_location(self):
        """Подтверждение с локацией."""
        history = HistoryService.confirmed(
            item=self.item,
            user=self.user,
            location="Warehouse B"
        )

        self.assertEqual(history.location.name, "Warehouse B")


class HistoryServiceEdgeCasesTestCase(HistoryServiceTestCase):
    """Edge cases тесты."""

    def test_none_user(self):
        """Операция без пользователя."""
        history = HistoryService.accepted(
            item=self.item,
            user=None,
            location="Warehouse"
        )

        self.assertIsNone(history.user)
        self.assertIsNotNone(history)
        self.assertIn("Warehouse", history.action)

    def test_none_location_uses_item_location(self):
        """None локация использует локацию из item для текста."""
        self.item.location = "Item's location"
        self.item.save()

        history = HistoryService.accepted(
            item=self.item,
            user=self.user,
            location=None
        )

        # Текст действия содержит локацию из item
        self.assertIn("Item's location", history.action)

    def test_special_characters_in_location(self):
        """Спецсимволы в названии локации."""
        location = "Склад №1/А (корпус 'Б')"
        history = HistoryService.accepted(
            item=self.item,
            user=self.user,
            location=location
        )

        self.assertEqual(history.location.name, location)

    def test_special_characters_in_comment(self):
        """Спецсимволы в комментарии."""
        comment = "Тест с \"кавычками\" и 'апострофами'"
        history = HistoryService.updated(
            item=self.item,
            user=self.user,
            comment=comment
        )

        self.assertEqual(history.comment, comment)

    def test_unicode_in_payload(self):
        """Unicode символы в payload."""
        payload = {"comment": "Кириллица: тест", "reason": "Русский текст"}
        history = HistoryService.create(
            item=self.item,
            action_type=HistoryAction.UPDATED,
            payload=payload,
            user=self.user
        )

        self.assertEqual(history.payload, payload)
        self.assertIn("Кириллица", history.action)

    def test_multiple_history_records(self):
        """Создание нескольких записей истории для одного item."""
        # Создаём несколько записей
        HistoryService.accepted(item=self.item, user=self.user, location="W1")
        HistoryService.locked(item=self.item, user=self.user, location="W1")
        history3 = HistoryService.confirmed(item=self.item, user=self.user, location="W1")

        # Проверяем что все записи созданы
        count = ItemHistory.objects.filter(item=self.item).count()
        self.assertEqual(count, 3)

    def test_empty_string_location(self):
        """Пустая строка как локация."""
        history = HistoryService.accepted(
            item=self.item,
            user=self.user,
            location=""
        )

        # Пустая строка считается как falsy, локация не создаётся в FK
        self.assertIsNone(history.location)

    def test_long_location_name(self):
        """Длинное название локации."""
        location = "A" * 500
        history = HistoryService.accepted(
            item=self.item,
            user=self.user,
            location=location
        )

        self.assertEqual(history.location.name, location)


class HistoryActionTemplatesTestCase(TestCase):
    """Тесты для HistoryActionTemplates."""

    def test_format_accepted(self):
        """Форматирование accepted."""
        payload = {"location": "Склад 1"}
        result = HistoryActionTemplates.format("accepted", payload)
        self.assertIn("Склад 1", result)
        self.assertIn("принято", result)

    def test_format_rejected(self):
        """Форматирование rejected."""
        payload = {"location": "Объект А"}
        result = HistoryActionTemplates.format("rejected", payload)
        self.assertIn("Объект А", result)
        self.assertIn("принято", result)

    def test_format_sent_to_service(self):
        """Форматирование sent_to_service."""
        payload = {"reason": "Неисправность"}
        result = HistoryActionTemplates.format("sent_to_service", payload)
        self.assertIn("Неисправность", result)
        self.assertIn("сервис", result)

    def test_format_updated(self):
        """Форматирование updated."""
        payload = {"comment": "Комментарий"}
        result = HistoryActionTemplates.format("updated", payload)
        self.assertIn("Комментарий", result)

    def test_format_status_changed(self):
        """Форматирование status_changed."""
        payload = {"old_status": "A", "new_status": "B"}
        result = HistoryActionTemplates.format("status_changed", payload)
        self.assertIn("A", result)
        self.assertIn("B", result)
        self.assertIn("→", result)

    def test_format_locked(self):
        """Форматирование locked."""
        payload = {"username": "ivanov"}
        result = HistoryActionTemplates.format("locked", payload)
        self.assertIn("ivanov", result)
        self.assertIn("Заблокировано", result)

    def test_format_unlocked(self):
        """Форматирование unlocked."""
        result = HistoryActionTemplates.format("unlocked", {})
        self.assertIn("Разблокировано", result)

    def test_format_unknown_action(self):
        """Форматирование неизвестного действия."""
        result = HistoryActionTemplates.format("unknown_action", {})
        self.assertEqual(result, "unknown_action")

    def test_format_with_none_payload(self):
        """Форматирование с None payload."""
        result = HistoryActionTemplates.format("accepted", None)
        self.assertIn("принято", result)

    def test_format_partial_payload(self):
        """Форматирование с неполным payload."""
        payload = {"location": "Склад"}
        result = HistoryActionTemplates.format("accepted", payload)
        self.assertIn("Склад", result)

    def test_get_template(self):
        """Получение шаблона."""
        template = HistoryActionTemplates.get_template("accepted")
        self.assertIn("{location}", template)

    def test_get_unknown_template(self):
        """Получение неизвестного шаблона."""
        template = HistoryActionTemplates.get_template("unknown")
        self.assertEqual(template, "unknown")

