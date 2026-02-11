"""Валидация переходов между статусами ТМЦ."""
from ..enums import ItemStatus


class ItemTransitions:
    """
    Матрица допустимых переходов между статусами.
    """

    # Какие статусы допускают отправку в сервис
    CAN_BE_SENT_TO_SERVICE = {
        ItemStatus.AVAILABLE,
        ItemStatus.AT_WORK,
        ItemStatus.ISSUED,
    }

    # Какие статусы допускают возврат из сермиса
    CAN_BE_RETURNED_FROM_SERVICE = {
        ItemStatus.IN_REPAIR,
    }

    # Какие статусы допускают подтверждение
    CAN_BE_CONFIRMED = {
        ItemStatus.CONFIRM,
    }

    # Статус после подтверждения
    STATUS_AFTER_CONFIRM = ItemStatus.ISSUED

    # Статус после возврата из сервиса (до подтверждения)
    STATUS_AFTER_SERVICE_RETURN = ItemStatus.CONFIRM_REPAIR

    @classmethod
    def can_send_to_service(cls, current_status: ItemStatus) -> bool:
        """Можно ли отправить ТМЦ в сервис."""
        return current_status in cls.CAN_BE_SENT_TO_SERVICE

    @classmethod
    def can_return_from_service(cls, current_status: ItemStatus) -> bool:
        """Можно ли вернуть ТМЦ из сервиса."""
        return current_status in cls.CAN_BE_RETURNED_FROM_SERVICE

    @classmethod
    def can_confirm(cls, current_status: ItemStatus) -> bool:
        """Можно ли подтвердить ТМЦ."""
        return current_status in cls.CAN_BE_CONFIRMED

    @classmethod
    def validate_send_to_service(cls, current_status: ItemStatus) -> None:
        """Валидация отправки в сервис. Raises ValueError."""
        if not cls.can_send_to_service(current_status):
            raise ValueError(
                f"ТМЦ со статусом '{current_status}' нельзя отправить в сервис. "
                f"Допустимые статусы: {cls.CAN_BE_SENT_TO_SERVICE}"
            )

    @classmethod
    def validate_return_from_service(cls, current_status: ItemStatus) -> None:
        """Валидация возврата из сервиса. Raises ValueError."""
        if not cls.can_return_from_service(current_status):
            raise ValueError(
                f"ТМЦ со статусом '{current_status}' нельзя вернуть из сервиса. "
                f"Допустимые статусы: {cls.CAN_BE_RETURNED_FROM_SERVICE}"
            )

    @classmethod
    def validate_confirm(cls, current_status: ItemStatus) -> None:
        """Валидация подтверждения. Raises ValueError."""
        if not cls.can_confirm(current_status):
            raise ValueError(
                f"ТМЦ со статусом '{current_status}' нельзя подтвердить. "
                f"Допустимые статусы: {cls.CAN_BE_CONFIRMED}"
            )

