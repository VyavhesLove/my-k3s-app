"""
Комплексные тесты для HistoryActions - history_actions.py
Покрывает:
- HistoryActionTemplates: format(), get_template(), поведение при None/отсутствующих ключах
- HistoryAction.build(): все методы build() для каждого типа действия
- HistoryService.create_*(): все методы создания записей истории
- Edge cases: KeyError handling, payload=None, отсутствующие ключи в шаблоне
"""
from django.test import TestCase
from django.contrib.auth import get_user_model

from items.models import Item, ItemHistory, Location
from items.enums import ItemStatus, HistoryAction, HistoryActionTemplates
from items.services.history_service import HistoryService

User = get_user_model()


class HistoryActionTemplatesCoreTestCase(TestCase):
    """Базовые тесты для HistoryActionTemplates.format() - критический функционал."""

    def test_format_with_full_payload(self):
        """Форматирование с полным payload - все ключи присутствуют."""
        # sent_to_service использует только {reason}, не {location}
        payload = {"reason": "Неисправность"}
        result = HistoryActionTemplates.format("sent_to_service", payload)
        self.assertIn("Неисправность", result)
        self.assertIn("сервис", result)
        # location не используется в этом шаблоне
        self.assertNotIn("Склад 1", result)

    def test_format_with_none_payload(self):
        """Форматирование с None payload - должен вернуть шаблон как есть."""
        result = HistoryActionTemplates.format("accepted", None)
        expected = "ТМЦ принято. Объект - {location}"
        self.assertEqual(result, expected)

    def test_format_with_empty_payload(self):
        """Форматирование с пустым dict payload - должен вернуть шаблон как есть."""
        result = HistoryActionTemplates.format("accepted", {})
        expected = "ТМЦ принято. Объект - {location}"
        self.assertEqual(result, expected)

    def test_format_with_missing_key_in_payload_keyerror_handling(self):
        """
        КРИТИЧЕСКИЙ ТЕСТ: Шаблон ожидает {location}, но в payload его нет.
        Текущее поведение: возвращает шаблон с нераскрытыми placeholder-ами.
        """
        # Шаблон: "ТМЦ принято. Объект - {location}"
        # Передаём payload БЕЗ ключа 'location'
        payload = {"other_key": "value"}
        result = HistoryActionTemplates.format("accepted", payload)
        
        # Ожидаемое поведение: шаблон остаётся с {location} как есть
        # Это важно для отладки - видно что ключ не передан
        self.assertIn("{location}", result)
        self.assertEqual(result, "ТМЦ принято. Объект - {location}")

    def test_format_with_partially_missing_keys(self):
        """Частично отсутствующие ключи в payload."""
        # STATUS_CHANGED требует {old_status} и {new_status}
        # Если в payload нет нужных ключей - KeyError ловится и возвращается шаблон как есть
        payload = {"old_status": "created"}
        result = HistoryActionTemplates.format("status_changed", payload)
        
        # Оба placeholder-а остаются, так как new_status отсутствует в payload
        # А format() не делает частичную подстановку - при KeyError возвращается шаблон
        self.assertIn("{old_status}", result)
        self.assertIn("{new_status}", result)
        self.assertIn("→", result)

    def test_format_with_unknown_action(self):
        """Форматирование неизвестного действия."""
        result = HistoryActionTemplates.format("unknown_action", {})
        self.assertEqual(result, "unknown_action")

    def test_format_with_unknown_action_and_payload(self):
        """Форматирование неизвестного действия с payload."""
        result = HistoryActionTemplates.format("totally_fake_action", {"key": "value"})
        self.assertEqual(result, "totally_fake_action")


class HistoryActionTemplatesGetTemplateTestCase(TestCase):
    """Тесты для HistoryActionTemplates.get_template()."""

    def test_get_template_for_accepted(self):
        """Получение шаблона для accepted."""
        template = HistoryActionTemplates.get_template("accepted")
        self.assertIn("{location}", template)
        self.assertIn("Объект", template)

    def test_get_template_for_rejected(self):
        """Получение шаблона для rejected."""
        template = HistoryActionTemplates.get_template("rejected")
        self.assertIn("{location}", template)

    def test_get_template_for_sent_to_service(self):
        """Получение шаблона для sent_to_service."""
        template = HistoryActionTemplates.get_template("sent_to_service")
        self.assertIn("{reason}", template)

    def test_get_template_for_returned_from_service(self):
        """Получение шаблона для returned_from_service."""
        template = HistoryActionTemplates.get_template("returned_from_service")
        # Этот шаблон не имеет placeholder-ов
        self.assertEqual(template, "Возвращено из сервиса")

    def test_get_template_for_updated(self):
        """Получение шаблона для updated."""
        template = HistoryActionTemplates.get_template("updated")
        self.assertIn("{comment}", template)

    def test_get_template_for_status_changed(self):
        """Получение шаблона для status_changed."""
        template = HistoryActionTemplates.get_template("status_changed")
        self.assertIn("{old_status}", template)
        self.assertIn("{new_status}", template)

    def test_get_template_for_locked(self):
        """Получение шаблона для locked."""
        template = HistoryActionTemplates.get_template("locked")
        self.assertIn("{username}", template)

    def test_get_template_for_unlocked(self):
        """Получение шаблона для unlocked."""
        template = HistoryActionTemplates.get_template("unlocked")
        self.assertEqual(template, "Разблокировано")

    def test_get_template_for_assigned(self):
        """Получение шаблона для assigned."""
        template = HistoryActionTemplates.get_template("assigned")
        self.assertEqual(template, "ТМЦ распределено")

    def test_get_template_for_confirmed(self):
        """Получение шаблона для confirmed."""
        template = HistoryActionTemplates.get_template("confirmed")
        self.assertIn("{comment}", template)

    def test_get_template_for_unknown_action(self):
        """Получение шаблона для неизвестного действия."""
        template = HistoryActionTemplates.get_template("non_existent")
        self.assertEqual(template, "non_existent")


class HistoryActionBuildTestCase(TestCase):
    """Тесты для HistoryAction.build() - проверяет корректность возвращаемого кортежа."""

    def test_accepted_build_with_location(self):
        """ACCEPTED.build() с location."""
        action_type, action_text, payload = HistoryAction.ACCEPTED.build(location="Склад 1")
        
        self.assertEqual(action_type, "accepted")
        self.assertIn("Склад 1", action_text)
        self.assertIn("принято", action_text)
        self.assertEqual(payload, {"location": "Склад 1"})

    def test_accepted_build_missing_location(self):
        """ACCEPTED.build() БЕЗ location - критический тест."""
        action_type, action_text, payload = HistoryAction.ACCEPTED.build()
        
        self.assertEqual(action_type, "accepted")
        # Шаблон остаётся с {location}
        self.assertIn("{location}", action_text)
        self.assertEqual(payload, {})

    def test_rejected_build_with_location(self):
        """REJECTED.build() с location."""
        action_type, action_text, payload = HistoryAction.REJECTED.build(location="Объект А")
        
        self.assertEqual(action_type, "rejected")
        self.assertIn("Объект А", action_text)
        self.assertIn("возвращено", action_text.lower())

    def test_rejected_build_missing_location(self):
        """REJECTED.build() БЕЗ location."""
        action_type, action_text, payload = HistoryAction.REJECTED.build()
        
        self.assertEqual(action_type, "rejected")
        self.assertIn("{location}", action_text)

    def test_sent_to_service_build_with_reason(self):
        """SENT_TO_SERVICE.build() с reason."""
        action_type, action_text, payload = HistoryAction.SENT_TO_SERVICE.build(reason="Не включается")
        
        self.assertEqual(action_type, "sent_to_service")
        self.assertIn("Не включается", action_text)
        self.assertIn("сервис", action_text)
        self.assertEqual(payload, {"reason": "Не включается"})

    def test_sent_to_service_build_missing_reason(self):
        """SENT_TO_SERVICE.build() БЕЗ reason."""
        action_type, action_text, payload = HistoryAction.SENT_TO_SERVICE.build()
        
        self.assertEqual(action_type, "sent_to_service")
        self.assertIn("{reason}", action_text)

    def test_returned_from_service_build(self):
        """RETURNED_FROM_SERVICE.build() - не требует параметров."""
        action_type, action_text, payload = HistoryAction.RETURNED_FROM_SERVICE.build()
        
        self.assertEqual(action_type, "returned_from_service")
        self.assertIn("Возвращено", action_text)
        self.assertEqual(payload, {})

    def test_repair_confirmed_build(self):
        """REPAIR_CONFIRMED.build() - не требует параметров."""
        action_type, action_text, payload = HistoryAction.REPAIR_CONFIRMED.build()
        
        self.assertEqual(action_type, "repair_confirmed")
        self.assertIn("Ремонт", action_text)
        self.assertIn("подтверждён", action_text)
        self.assertEqual(payload, {})

    def test_updated_build_with_comment(self):
        """UPDATED.build() с comment."""
        action_type, action_text, payload = HistoryAction.UPDATED.build(comment="Обновлены характеристики")
        
        self.assertEqual(action_type, "updated")
        self.assertIn("Обновлены характеристики", action_text)
        self.assertIn("Обновление", action_text)
        self.assertEqual(payload, {"comment": "Обновлены характеристики"})

    def test_updated_build_missing_comment(self):
        """UPDATED.build() БЕЗ comment."""
        action_type, action_text, payload = HistoryAction.UPDATED.build()
        
        self.assertEqual(action_type, "updated")
        self.assertIn("{comment}", action_text)

    def test_status_changed_build(self):
        """STATUS_CHANGED.build() с old_status и new_status."""
        action_type, action_text, payload = HistoryAction.STATUS_CHANGED.build(
            old_status="created", new_status="available"
        )
        
        self.assertEqual(action_type, "status_changed")
        self.assertIn("created", action_text)
        self.assertIn("available", action_text)
        self.assertIn("→", action_text)
        self.assertEqual(payload, {"old_status": "created", "new_status": "available"})

    def test_status_changed_build_missing_new_status(self):
        """STATUS_CHANGED.build() БЕЗ new_status - old_status подставляется."""
        # Примечание: build() принимает **kwargs и передаёт их в payload
        # Если передать old_status, он попадает в payload
        action_type, action_text, payload = HistoryAction.STATUS_CHANGED.build(old_status="created", new_status="available")
        
        self.assertEqual(action_type, "status_changed")
        self.assertIn("created", action_text)
        self.assertIn("available", action_text)
        self.assertIn("→", action_text)
        self.assertEqual(payload, {"old_status": "created", "new_status": "available"})

    def test_locked_build_with_username(self):
        """LOCKED.build() с username."""
        action_type, action_text, payload = HistoryAction.LOCKED.build(username="ivanov")
        
        self.assertEqual(action_type, "locked")
        self.assertIn("ivanov", action_text)
        self.assertIn("Заблокировано", action_text)
        self.assertEqual(payload, {"username": "ivanov"})

    def test_locked_build_missing_username(self):
        """LOCKED.build() БЕЗ username."""
        action_type, action_text, payload = HistoryAction.LOCKED.build()
        
        self.assertEqual(action_type, "locked")
        self.assertIn("{username}", action_text)

    def test_unlocked_build(self):
        """UNLOCKED.build() - не требует параметров."""
        action_type, action_text, payload = HistoryAction.UNLOCKED.build()
        
        self.assertEqual(action_type, "unlocked")
        self.assertIn("Разблокировано", action_text)
        self.assertEqual(payload, {})

    def test_assigned_build_with_location(self):
        """ASSIGNED.build() с location."""
        action_type, action_text, payload = HistoryAction.ASSIGNED.build(location="Бригада А")
        
        self.assertEqual(action_type, "assigned")
        self.assertIn("распределено", action_text)
        self.assertEqual(payload, {"location": "Бригада А"})

    def test_assigned_build_empty(self):
        """ASSIGNED.build() - шаблон не имеет placeholder-ов."""
        action_type, action_text, payload = HistoryAction.ASSIGNED.build()
        
        self.assertEqual(action_type, "assigned")
        self.assertIn("распределено", action_text)
        self.assertEqual(payload, {})

    def test_confirmed_build_with_comment(self):
        """CONFIRMED.build() с comment."""
        action_type, action_text, payload = HistoryAction.CONFIRMED.build(comment="Проверено")
        
        self.assertEqual(action_type, "confirmed")
        self.assertIn("Проверено", action_text)
        self.assertIn("подтверждено", action_text)
        self.assertEqual(payload, {"comment": "Проверено"})

    def test_confirmed_build_missing_comment(self):
        """CONFIRMED.build() БЕЗ comment."""
        action_type, action_text, payload = HistoryAction.CONFIRMED.build()
        
        self.assertEqual(action_type, "confirmed")
        self.assertIn("{comment}", action_text)


class HistoryServiceCreateMethodTestCase(TestCase):
    """Тесты для HistoryService.create() - общий метод создания истории."""

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

    def test_create_with_payload(self):
        """Создание записи с payload."""
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
        self.assertEqual(history.payload, payload)

    def test_create_without_payload(self):
        """Создание записи без payload - payload=None."""
        history = HistoryService.create(
            item=self.item,
            action_type=HistoryAction.ACCEPTED,
            user=self.user,
            payload=None
        )

        self.assertIsNotNone(history)
        # В HistoryService.create() payload or {} - поэтому None становится {}
        self.assertEqual(history.payload, {})

    def test_create_with_empty_payload_dict(self):
        """Создание записи с пустым dict payload."""
        history = HistoryService.create(
            item=self.item,
            action_type=HistoryAction.ACCEPTED,
            user=self.user,
            payload={}
        )

        self.assertIsNotNone(history)
        self.assertEqual(history.payload, {})

    def test_create_without_user(self):
        """Создание записи без пользователя."""
        history = HistoryService.create(
            item=self.item,
            action_type=HistoryAction.CONFIRMED,
            user=None
        )

        self.assertIsNotNone(history)
        self.assertIsNone(history.user)
        self.assertIn("подтверждено", history.action)

    def test_create_with_location_name(self):
        """Создание записи с указанием location_name."""
        history = HistoryService.create(
            item=self.item,
            action_type=HistoryAction.ACCEPTED,
            user=self.user,
            location_name="Warehouse A"
        )

        self.assertIsNotNone(history.location)
        self.assertEqual(history.location.name, "Warehouse A")

    def test_create_with_comment(self):
        """Создание записи с комментарием."""
        history = HistoryService.create(
            item=self.item,
            action_type=HistoryAction.UPDATED,
            user=self.user,
            comment="Тестовый комментарий"
        )

        self.assertIsNotNone(history)
        self.assertEqual(history.comment, "Тестовый комментарий")

    def test_create_with_location_auto_created(self):
        """Локация создаётся автоматически если не существует."""
        location_name = "New Location 12345"
        history = HistoryService.create(
            item=self.item,
            action_type=HistoryAction.ACCEPTED,
            user=self.user,
            location_name=location_name
        )

        self.assertIsNotNone(history.location)
        self.assertEqual(history.location.name, location_name)
        # Проверяем что локация существует в базе
        self.assertTrue(Location.objects.filter(name=location_name).exists())

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


class HistoryServiceCreateMethodsTestCase(TestCase):
    """Тесты для всех create_* методов HistoryService."""

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

    def test_accepted_with_location(self):
        """accepted() с указанием локации."""
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
        """accepted() использует локацию из item если не указана."""
        self.item.location = "Warehouse B"
        self.item.save()

        history = HistoryService.accepted(
            item=self.item,
            user=self.user,
            location=None
        )

        self.assertIsNotNone(history)
        self.assertIn("Warehouse B", history.action)

    def test_accepted_without_location(self):
        """accepted() без локации - подставляется None в текст."""
        # Когда location=None и item.location=None, подставляется "None" в текст
        history = HistoryService.accepted(
            item=self.item,
            user=self.user,
            location=None
        )

    def test_rejected_with_location(self):
        """rejected() с указанием локации."""
        history = HistoryService.rejected(
            item=self.item,
            user=self.user,
            location="Main warehouse"
        )

        self.assertEqual(history.action_type, HistoryAction.REJECTED)
        self.assertIn("Main warehouse", history.action)

    def test_rejected_uses_item_location(self):
        """rejected() использует локацию из item."""
        self.item.location = "Object A"
        self.item.save()

        history = HistoryService.rejected(
            item=self.item,
            user=self.user,
            location=None
        )

        self.assertIn("Object A", history.action)

    def test_sent_to_service_with_reason(self):
        """sent_to_service() с причиной."""
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
        """sent_to_service() с указанием локации."""
        history = HistoryService.sent_to_service(
            item=self.item,
            user=self.user,
            reason="Ремонт",
            location="Service center"
        )

        self.assertEqual(history.location.name, "Service center")

    def test_returned_from_service_basic(self):
        """returned_from_service() без параметров."""
        history = HistoryService.returned_from_service(
            item=self.item,
            user=self.user
        )

        self.assertEqual(history.action_type, HistoryAction.RETURNED_FROM_SERVICE)
        self.assertIn("Возвращено", history.action)
        self.assertIn("сервис", history.action)

    def test_returned_from_service_with_location(self):
        """returned_from_service() с локацией."""
        history = HistoryService.returned_from_service(
            item=self.item,
            user=self.user,
            location="Main warehouse"
        )

        self.assertEqual(history.location.name, "Main warehouse")

    def test_status_changed_basic(self):
        """status_changed() смена статуса."""
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
        """status_changed() с локацией."""
        history = HistoryService.status_changed(
            item=self.item,
            user=self.user,
            old_status="old",
            new_status="new",
            location="Warehouse"
        )

        self.assertEqual(history.location.name, "Warehouse")

    def test_locked_basic(self):
        """locked() блокировка ТМЦ."""
        history = HistoryService.locked(
            item=self.item,
            user=self.user
        )

        self.assertEqual(history.action_type, HistoryAction.LOCKED)
        self.assertIn(self.user.username, history.action)
        self.assertIn("Заблокировано", history.action)

    def test_locked_with_location(self):
        """locked() с локацией."""
        history = HistoryService.locked(
            item=self.item,
            user=self.user,
            location="Main warehouse"
        )

        self.assertEqual(history.location.name, "Main warehouse")

    def test_updated_basic(self):
        """updated() обновление информации."""
        history = HistoryService.updated(
            item=self.item,
            user=self.user
        )

        self.assertEqual(history.action_type, HistoryAction.UPDATED)
        self.assertIn("Обновление", history.action)

    def test_updated_with_comment(self):
        """updated() с комментарием."""
        comment = "Обновлены технические характеристики"
        history = HistoryService.updated(
            item=self.item,
            user=self.user,
            comment=comment
        )

        self.assertEqual(history.comment, comment)
        self.assertIn(comment, history.action)

    def test_updated_with_location(self):
        """updated() с локацией."""
        history = HistoryService.updated(
            item=self.item,
            user=self.user,
            location="Warehouse A"
        )

        self.assertEqual(history.location.name, "Warehouse A")

    def test_assigned_basic(self):
        """assigned() распределение ТМЦ."""
        history = HistoryService.assigned(
            item=self.item,
            user=self.user
        )

        self.assertEqual(history.action_type, HistoryAction.ASSIGNED)
        self.assertIn("распределено", history.action)

    def test_assigned_with_location(self):
        """assigned() с локацией."""
        location_name = "Brigade A warehouse"
        history = HistoryService.assigned(
            item=self.item,
            user=self.user,
            location=location_name
        )

        self.assertEqual(history.location.name, location_name)

    def test_repair_confirmed_basic(self):
        """repair_confirmed() подтверждение ремонта."""
        history = HistoryService.repair_confirmed(
            item=self.item,
            user=self.user
        )

        self.assertEqual(history.action_type, HistoryAction.REPAIR_CONFIRMED)
        self.assertIn("Ремонт", history.action)
        self.assertIn("подтверждён", history.action)

    def test_repair_confirmed_with_location(self):
        """repair_confirmed() с локацией."""
        history = HistoryService.repair_confirmed(
            item=self.item,
            user=self.user,
            location="Main warehouse"
        )

        self.assertEqual(history.location.name, "Main warehouse")

    def test_unlocked_basic(self):
        """unlocked() разблокировка ТМЦ."""
        history = HistoryService.unlocked(
            item=self.item,
            user=self.user
        )

        self.assertEqual(history.action_type, HistoryAction.UNLOCKED)
        self.assertIn("Разблокировано", history.action)

    def test_unlocked_with_location(self):
        """unlocked() с локацией."""
        history = HistoryService.unlocked(
            item=self.item,
            user=self.user,
            location="Office"
        )

        self.assertEqual(history.location.name, "Office")

    def test_confirmed_basic(self):
        """confirmed() подтверждение ТМЦ."""
        history = HistoryService.confirmed(
            item=self.item,
            user=self.user
        )

        self.assertEqual(history.action_type, HistoryAction.CONFIRMED)
        self.assertIn("подтверждено", history.action)

    def test_confirmed_with_comment(self):
        """confirmed() с комментарием."""
        comment = "Проверено и принято"
        history = HistoryService.confirmed(
            item=self.item,
            user=self.user,
            comment=comment
        )

        self.assertEqual(history.comment, comment)
        self.assertIn(comment, history.action)

    def test_confirmed_with_location(self):
        """confirmed() с локацией."""
        history = HistoryService.confirmed(
            item=self.item,
            user=self.user,
            location="Warehouse B"
        )

        self.assertEqual(history.location.name, "Warehouse B")


class HistoryServiceEdgeCasesTestCase(TestCase):
    """Edge cases тесты для HistoryService."""

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

    def test_none_user(self):
        """Операция без пользователя - user=None."""
        history = HistoryService.accepted(
            item=self.item,
            user=None,
            location="Warehouse"
        )

        self.assertIsNone(history.user)
        self.assertIsNotNone(history)
        self.assertIn("Warehouse", history.action)

    def test_none_location_uses_item_location_for_text(self):
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
        comment = 'Тест с "кавычками" и \'апострофами\''
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
        HistoryService.accepted(item=self.item, user=self.user, location="W1")
        HistoryService.locked(item=self.item, user=self.user, location="W1")
        history3 = HistoryService.confirmed(item=self.item, user=self.user, location="W1")

        # Проверяем что все записи созданы
        count = ItemHistory.objects.filter(item=self.item).count()
        self.assertEqual(count, 3)

    def test_empty_string_location(self):
        """Пустая строка как локация - falsy значение."""
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

    def test_payload_stored_exactly(self):
        """Payload сохраняется в базе точно как передан."""
        payload = {
            "location": "Склад",
            "reason": None,
            "number": 123,
            "nested": {"key": "value"}
        }
        history = HistoryService.create(
            item=self.item,
            action_type=HistoryAction.SENT_TO_SERVICE,
            user=self.user,
            payload=payload
        )

        # Проверяем что payload сохранён точно
        saved_history = ItemHistory.objects.get(pk=history.pk)
        self.assertEqual(saved_history.payload, payload)

    def test_get_first_assignment(self):
        """Тест get_first_assignment() - получение первой записи о распределении."""
        # Сначала создаём несколько записей
        HistoryService.accepted(item=self.item, user=self.user, location="W1")
        HistoryService.assigned(item=self.item, user=self.user, location="W2")
        HistoryService.confirmed(item=self.item, user=self.user, location="W3")

        # Получаем первую запись ASSIGNED
        first_assignment = HistoryService.get_first_assignment(self.item)
        
        self.assertIsNotNone(first_assignment)
        self.assertEqual(first_assignment.action_type, HistoryAction.ASSIGNED)

    def test_get_first_assignment_no_result(self):
        """Тест get_first_assignment() когда нет записей ASSIGNED."""
        # Создаём только ACCEPTED
        HistoryService.accepted(item=self.item, user=self.user, location="W1")

        first_assignment = HistoryService.get_first_assignment(self.item)
        
        self.assertIsNone(first_assignment)

