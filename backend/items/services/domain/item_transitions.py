"""Валидация переходов между статусами ТМЦ."""
from .exceptions import DomainValidationError
from items.enums import ItemStatus


class ItemTransitions:
    """
    Матрица допустимых переходов между статусами ТМЦ.

    Используйте can_transition() для проверки или
    validate_transition() для проверки с автоматическим исключением.
    """

    # ========== ЦЕНТРАЛЬНАЯ ТАБЛИЦА ДОПУСТИМЫХ ПЕРЕХОДОВ ==========
    # Ключ: текущий статус -> Значение: список допустимых следующих статусов
    #
    # Матрица переходов:
    # | Операция              | Из статуса         | В статус      |
    # |-----------------------|--------------------|---------------|
    # | Создание ТМЦ         | Created            | available     |
    # | Распределение         | available          | confirm        |
    # | Подтверждение         | confirm            | issued         |
    # | Выдача в бригаду      | available, confirm | at_work       |
    # | Возврат с работы     | at_work            | issued         |
    # | Отправка в ремонт    | issued, at_work    | confirm_repair|
    # | Подтверждение ремонта | confirm_repair     | in_repair     |
    # | Возврат из ремонта   | in_repair          | issued         |
    # | Списание              | Любой статус       | written_off   |
    # | Отмена списания       | written_off        | available      |
    #
    ALLOWED_TRANSITIONS = {
        # Создание: created → available
        ItemStatus.CREATED: [ItemStatus.AVAILABLE],

        # Распределение: available → confirm
        ItemStatus.AVAILABLE: [
            ItemStatus.CONFIRM,      # Распределение
            ItemStatus.AT_WORK,       # Выдача в бригаду напрямую
        ],

        # Подтверждение ТМЦ: confirm → issued (подтверждение) или at_work (выдача)
        ItemStatus.CONFIRM: [
            ItemStatus.ISSUED,        # Подтверждение
            ItemStatus.AT_WORK,       # Выдача в бригаду
        ],

        # Выдано в работу: at_work → issued (возврат) или confirm_repair (в ремонт)
        ItemStatus.AT_WORK: [
            ItemStatus.ISSUED,        # Возврат с работы
            ItemStatus.CONFIRM_REPAIR, # Отправка в ремонт
        ],

        # Выдано: issued → confirm_repair (в ремонт) или confirm (перераспределение)
        ItemStatus.ISSUED: [
            ItemStatus.CONFIRM_REPAIR, # Отправка в ремонт
            ItemStatus.CONFIRM,        # Перераспределение
        ],

        # Ожидает подтверждения ремонта: confirm_repair → in_repair (подтверждение)
        ItemStatus.CONFIRM_REPAIR: [
            ItemStatus.IN_REPAIR,      # Подтверждение ремонта
        ],

        # В ремонте: in_repair → issued (возврат из ремонта)
        ItemStatus.IN_REPAIR: [
            ItemStatus.ISSUED,         # Возврат из ремонта
        ],

        # Списано: written_off → available (отмена списания)
        ItemStatus.WRITTEN_OFF: [
            ItemStatus.AVAILABLE,      # Отмена списания
        ],
    }

    # ========== КОНСТАНТЫ ДЛЯ ОБРАТНОЙ СОВМЕСТИМОСТИ ==========
    # Статус после подтверждения
    STATUS_AFTER_CONFIRM = ItemStatus.ISSUED

    # Статус после возврата из сервиса (до подтверждения)
    STATUS_AFTER_SERVICE_RETURN = ItemStatus.CONFIRM_REPAIR

    # ========== УНИВЕРСАЛЬНЫЕ МЕТОДЫ ==========

    @classmethod
    def can_transition(cls, from_status: ItemStatus, to_status: ItemStatus) -> bool:
        """
        Проверка допустимости перехода между статусами.

        Args:
            from_status: Текущий статус
            to_status: Целевой статус

        Returns:
            bool: True если переход допустим, False иначе
        """
        allowed_targets = cls.ALLOWED_TRANSITIONS.get(from_status, [])
        return to_status in allowed_targets

    @classmethod
    def can_write_off(cls, current_status: ItemStatus) -> bool:
        """
        Можно ли списать ТМЦ.
        Списание возможно из любого статуса.
        """
        return True  # Списание допустимо из любого статуса

    @classmethod
    def validate_transition(
        cls, from_status: ItemStatus, to_status: ItemStatus
    ) -> None:
        """
        Валидация перехода между статусами.

        Raises:
            DomainValidationError: Если переход недопустим
        """
        if not cls.can_transition(from_status, to_status):
            allowed = cls.ALLOWED_TRANSITIONS.get(from_status, [])
            raise DomainValidationError(
                f"Недопустимый переход статуса: '{from_status}' → '{to_status}'. "
                f"Допустимые переходы из '{from_status}': {allowed}"
            )

    @classmethod
    def validate_write_off(cls, current_status: ItemStatus) -> None:
        """
        Валидация списания.
        Списание допустимо из любого статуса.
        """
        pass  # Списание всегда допустимо

    # ========== МЕТОДЫ ДЛЯ ОБРАТНОЙ СОВМЕСТИМОСТИ ==========

    @classmethod
    def can_send_to_service(cls, current_status: ItemStatus) -> bool:
        """Можно ли отправить ТМЦ в сервис (в ремонт)."""
        return cls.can_transition(current_status, ItemStatus.IN_REPAIR)

    @classmethod
    def can_return_from_service(cls, current_status: ItemStatus) -> bool:
        """Можно ли вернуть ТМЦ из сервиса."""
        return cls.can_transition(current_status, ItemStatus.CONFIRM_REPAIR)

    @classmethod
    def can_confirm(cls, current_status: ItemStatus) -> bool:
        """Можно ли подтвердить ТМЦ (CREATED -> AVAILABLE)."""
        # Подтверждение возможно только из статуса CREATED
        return current_status == ItemStatus.CREATED

    @classmethod
    def can_reject(cls, current_status: ItemStatus) -> bool:
        """Можно ли отклонить ТМЦ (CONFIRM -> ISSUED)."""
        # Отклонение возможно только из статуса CONFIRM
        return current_status == ItemStatus.CONFIRM

    @classmethod
    def validate_send_to_service(cls, current_status: ItemStatus) -> None:
        """Валидация отправки в сервис. Raises DomainValidationError."""
        if not cls.can_send_to_service(current_status):
            raise DomainValidationError(
                f"ТМЦ со статусом '{current_status}' нельзя отправить в сервис. "
                f"Допустимые переходы: {cls.ALLOWED_TRANSITIONS.get(current_status, [])}"
            )

    @classmethod
    def validate_return_from_service(cls, current_status: ItemStatus) -> None:
        """Валидация возврата из сервиса. Raises DomainValidationError."""
        if not cls.can_return_from_service(current_status):
            raise DomainValidationError(
                f"ТМЦ со статусом '{current_status}' нельзя вернуть из сервиса. "
                f"Допустимые переходы: {cls.ALLOWED_TRANSITIONS.get(current_status, [])}"
            )

    @classmethod
    def validate_confirm(cls, current_status: ItemStatus) -> None:
        """Валидация подтверждения. Raises DomainValidationError."""
        if not cls.can_confirm(current_status):
            raise DomainValidationError(
                f"ТМЦ со статусом '{current_status}' нельзя подтвердить. "
                f"Допустимые переходы: {cls.ALLOWED_TRANSITIONS.get(current_status, [])}"
            )

