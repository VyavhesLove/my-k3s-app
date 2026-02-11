"""Тесты для валидации переходов между статусами ТМЦ."""
from django.test import TestCase
from items.enums import ItemStatus
from items.services.domain.item_transitions import ItemTransitions
from items.services.domain.exceptions import DomainValidationError


class ItemTransitionsTestCase(TestCase):
    """Тесты для класса ItemTransitions."""

    # ========== ТЕСТЫ ДОПУСТИМЫХ ПЕРЕХОДОВ ==========

    def test_created_to_available(self):
        """CREATED → AVAILABLE: Создание ТМЦ."""
        self.assertTrue(
            ItemTransitions.can_transition(
                ItemStatus.CREATED,
                ItemStatus.AVAILABLE
            )
        )

    def test_available_to_confirm(self):
        """AVAILABLE → CONFIRM: Распределение ТМЦ."""
        self.assertTrue(
            ItemTransitions.can_transition(
                ItemStatus.AVAILABLE,
                ItemStatus.CONFIRM
            )
        )

    def test_available_to_at_work(self):
        """AVAILABLE → AT_WORK: Выдача в бригаду напрямую."""
        self.assertTrue(
            ItemTransitions.can_transition(
                ItemStatus.AVAILABLE,
                ItemStatus.AT_WORK
            )
        )

    def test_confirm_to_issued(self):
        """CONFIRM → ISSUED: Подтверждение ТМЦ."""
        self.assertTrue(
            ItemTransitions.can_transition(
                ItemStatus.CONFIRM,
                ItemStatus.ISSUED
            )
        )

    def test_confirm_to_at_work(self):
        """CONFIRM → AT_WORK: Выдача в бригаду."""
        self.assertTrue(
            ItemTransitions.can_transition(
                ItemStatus.CONFIRM,
                ItemStatus.AT_WORK
            )
        )

    def test_at_work_to_issued(self):
        """AT_WORK → ISSUED: Возврат с работы."""
        self.assertTrue(
            ItemTransitions.can_transition(
                ItemStatus.AT_WORK,
                ItemStatus.ISSUED
            )
        )

    def test_at_work_to_confirm_repair(self):
        """AT_WORK → CONFIRM_REPAIR: Отправка в ремонт."""
        self.assertTrue(
            ItemTransitions.can_transition(
                ItemStatus.AT_WORK,
                ItemStatus.CONFIRM_REPAIR
            )
        )

    def test_issued_to_confirm_repair(self):
        """ISSUED → CONFIRM_REPAIR: Отправка в ремонт."""
        self.assertTrue(
            ItemTransitions.can_transition(
                ItemStatus.ISSUED,
                ItemStatus.CONFIRM_REPAIR
            )
        )

    def test_issued_to_confirm(self):
        """ISSUED → CONFIRM: Перераспределение."""
        self.assertTrue(
            ItemTransitions.can_transition(
                ItemStatus.ISSUED,
                ItemStatus.CONFIRM
            )
        )

    def test_confirm_repair_to_in_repair(self):
        """CONFIRM_REPAIR → IN_REPAIR: Подтверждение ремонта."""
        self.assertTrue(
            ItemTransitions.can_transition(
                ItemStatus.CONFIRM_REPAIR,
                ItemStatus.IN_REPAIR
            )
        )

    def test_in_repair_to_issued(self):
        """IN_REPAIR → ISSUED: Возврат из ремонта."""
        self.assertTrue(
            ItemTransitions.can_transition(
                ItemStatus.IN_REPAIR,
                ItemStatus.ISSUED
            )
        )

    def test_written_off_to_available(self):
        """WRITTEN_OFF → AVAILABLE: Отмена списания."""
        self.assertTrue(
            ItemTransitions.can_transition(
                ItemStatus.WRITTEN_OFF,
                ItemStatus.AVAILABLE
            )
        )

    # ========== ТЕСТЫ ЗАПРЕЩЁННЫХ ПЕРЕХОДОВ ==========

    def test_forbidden_transition_raises_error(self):
        """Запрещённый переход выбрасывает DomainValidationError."""
        with self.assertRaises(DomainValidationError):
            ItemTransitions.validate_transition(
                ItemStatus.CREATED,
                ItemStatus.ISSUED
            )

    def test_created_cannot_go_to_issued(self):
        """CREATED не может перейти в ISSUED напрямую."""
        self.assertFalse(
            ItemTransitions.can_transition(
                ItemStatus.CREATED,
                ItemStatus.ISSUED
            )
        )

    def test_available_cannot_go_to_issued(self):
        """AVAILABLE не может перейти в ISSUED напрямую."""
        self.assertFalse(
            ItemTransitions.can_transition(
                ItemStatus.AVAILABLE,
                ItemStatus.ISSUED
            )
        )

    def test_confirm_repair_cannot_go_to_available(self):
        """CONFIRM_REPAIR не может перейти в AVAILABLE."""
        self.assertFalse(
            ItemTransitions.can_transition(
                ItemStatus.CONFIRM_REPAIR,
                ItemStatus.AVAILABLE
            )
        )

    def test_in_repair_cannot_go_to_confirm(self):
        """IN_REPAIR не может перейти в CONFIRM."""
        self.assertFalse(
            ItemTransitions.can_transition(
                ItemStatus.IN_REPAIR,
                ItemStatus.CONFIRM
            )
        )

    def test_written_off_cannot_go_to_issued(self):
        """WRITTEN_OFF не может перейти в ISSUED."""
        self.assertFalse(
            ItemTransitions.can_transition(
                ItemStatus.WRITTEN_OFF,
                ItemStatus.ISSUED
            )
        )

    # ========== ТЕСТЫ НЕИЗВЕСТНЫХ СТАТУСОВ ==========

    def test_unknown_status_returns_empty(self):
        """Неизвестный статус возвращает пустой список."""
        # Используем несуществующий статус
        unknown_status = "unknown_status"
        self.assertFalse(
            ItemTransitions.can_transition(
                unknown_status,  # type: ignore
                ItemStatus.AVAILABLE
            )
        )

    def test_validate_unknown_status_raises_error(self):
        """Валидация с неизвестным статусом выбрасывает ошибку."""
        with self.assertRaises(DomainValidationError):
            ItemTransitions.validate_transition(
                "invalid_status",  # type: ignore
                ItemStatus.AVAILABLE
            )

    # ========== ТЕСТЫ СПИСАНИЯ ==========

    def test_write_off_always_allowed(self):
        """Списание допустимо из любого статуса."""
        for status in ItemStatus.values:
            self.assertTrue(
                ItemTransitions.can_write_off(status),  # type: ignore
                f"Списание должно быть допустимо из статуса {status}"
            )

    def test_validate_write_off_never_raises(self):
        """Валидация списания не выбрасывает ошибку."""
        for status in ItemStatus.values:
            # Не должно выбросить исключение
            ItemTransitions.validate_write_off(status)  # type: ignore

    # ========== ТЕСТЫ ОБРАТНОЙ СОВМЕСТИМОСТИ ==========

    def test_can_send_to_service(self):
        """can_send_to_service работает корректно."""
        # Можно отправить в ремонт из issued (переход в confirm_repair)
        self.assertTrue(
            ItemTransitions.can_send_to_service(ItemStatus.ISSUED)
        )
        # Можно отправить в ремонт из at_work (переход в confirm_repair)
        self.assertTrue(
            ItemTransitions.can_send_to_service(ItemStatus.AT_WORK)
        )
        # Нельзя отправить из available
        self.assertFalse(
            ItemTransitions.can_send_to_service(ItemStatus.AVAILABLE)
        )
        # Нельзя отправить из created
        self.assertFalse(
            ItemTransitions.can_send_to_service(ItemStatus.CREATED)
        )

    def test_can_return_from_service(self):
        """can_return_from_service работает корректно."""
        # Можно вернуть из in_repair (переход в issued)
        self.assertTrue(
            ItemTransitions.can_return_from_service(ItemStatus.IN_REPAIR)
        )
        # Нельзя вернуть из available
        self.assertFalse(
            ItemTransitions.can_return_from_service(ItemStatus.AVAILABLE)
        )
        # Нельзя вернуть из created
        self.assertFalse(
            ItemTransitions.can_return_from_service(ItemStatus.CREATED)
        )

    def test_validate_send_to_service(self):
        """validate_send_to_service выбрасывает ошибку при недопустимом статусе."""
        with self.assertRaises(DomainValidationError):
            ItemTransitions.validate_send_to_service(ItemStatus.AVAILABLE)

    def test_validate_return_from_service(self):
        """validate_return_from_service выбрасывает ошибку при недопустимом статусе."""
        with self.assertRaises(DomainValidationError):
            ItemTransitions.validate_return_from_service(ItemStatus.AVAILABLE)

    def test_can_confirm(self):
        """can_confirm работает для всех статусов из таблицы переходов."""
        # Все статусы, которые есть в ALLOWED_TRANSITIONS, могут быть подтверждены
        for status in ItemTransitions.ALLOWED_TRANSITIONS.keys():
            self.assertTrue(
                ItemTransitions.can_confirm(status),
                f"Статус {status} должен допускать подтверждение"
            )

    def test_validate_confirm(self):
        """validate_confirm выбрасывает ошибку для статусов не в таблице."""
        # Несуществующий статус должен выбросить ошибку
        with self.assertRaises(DomainValidationError):
            ItemTransitions.validate_confirm("invalid_status")

    # ========== ТЕСТЫ КОНСТАНТ ==========

    def test_status_after_confirm(self):
        """STATUS_AFTER_CONFIRM равен ISSUED."""
        self.assertEqual(
            ItemTransitions.STATUS_AFTER_CONFIRM,
            ItemStatus.ISSUED
        )

    def test_status_after_service_return(self):
        """STATUS_AFTER_SERVICE_RETURN равен CONFIRM_REPAIR."""
        self.assertEqual(
            ItemTransitions.STATUS_AFTER_SERVICE_RETURN,
            ItemStatus.CONFIRM_REPAIR
        )

    # ========== ТЕСТЫ can_transition ВОЗВРАЩАЮТ bool ==========

    def test_can_transition_returns_boolean(self):
        """can_transition возвращает булево значение."""
        result = ItemTransitions.can_transition(
            ItemStatus.CREATED,
            ItemStatus.AVAILABLE
        )
        self.assertIsInstance(result, bool)
        self.assertTrue(result)

    def test_can_transition_false_returns_boolean(self):
        """can_transition возвращает False для запрещённых переходов."""
        result = ItemTransitions.can_transition(
            ItemStatus.CREATED,
            ItemStatus.ISSUED
        )
        self.assertIsInstance(result, bool)
        self.assertFalse(result)

