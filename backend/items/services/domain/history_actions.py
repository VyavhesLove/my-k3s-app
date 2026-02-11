"""Форматировщики сообщений для истории ТМЦ."""
from ...enums import HistoryAction


class HistoryActionsFormatter:
    """
    Формирует текстовые сообщения для записей в историю.
    Использует HistoryAction enum для типизации действий.
    """

    # === Подтверждение ТМЦ ===
    @staticmethod
    def accepted(location: str = None) -> tuple[str, HistoryAction]:
        """Формирует сообщение о принятии ТМЦ."""
        if location:
            return f"ТМЦ принято. Объект - {location}", HistoryAction.ACCEPTED
        return "ТМЦ принято", HistoryAction.ACCEPTED

    @staticmethod
    def rejected(location: str = None) -> tuple[str, HistoryAction]:
        """Формирует сообщение об отклонении ТМЦ."""
        if location:
            return f"ТМЦ не принято. Возвращено на объект - {location}", HistoryAction.REJECTED
        return "ТМЦ не принято", HistoryAction.REJECTED

    @staticmethod
    def confirmed(comment: str = None) -> tuple[str, HistoryAction]:
        """Формирует сообщение о подтверждении ТМЦ."""
        if comment:
            return f"ТМЦ подтверждено. Комментарий: {comment}", HistoryAction.CONFIRMED
        return "ТМЦ подтверждено", HistoryAction.CONFIRMED

    # === Сервисные операции ===
    @staticmethod
    def sent_to_service(reason: str) -> tuple[str, HistoryAction]:
        """Формирует сообщение об отправке в сервис."""
        text = f"Отправлено в сервис. Причина: {reason}. Ожидание подтверждения."
        return text, HistoryAction.SENT_TO_SERVICE

    @staticmethod
    def returned_from_service() -> tuple[str, HistoryAction]:
        """Формирует сообщение о возврате из сервиса."""
        return "Возвращено из сервиса", HistoryAction.RETURNED_FROM_SERVICE

    @staticmethod
    def repair_confirmed() -> tuple[str, HistoryAction]:
        """Формирует сообщение о подтверждении ремонта."""
        return "Ремонт подтверждён", HistoryAction.REPAIR_CONFIRMED

    # === Обновление ===
    @staticmethod
    def updated(comment: str = None) -> tuple[str, HistoryAction]:
        """Формирует сообщение об обновлении."""
        if comment:
            return f"Обновление информации. Комментарий: {comment}", HistoryAction.UPDATED
        return "Обновление информации", HistoryAction.UPDATED

    @staticmethod
    def status_changed(old_status: str, new_status: str) -> tuple[str, HistoryAction]:
        """Формирует сообщение о смене статуса."""
        text = f"Смена статуса: {old_status} → {new_status}"
        return text, HistoryAction.STATUS_CHANGED

    # === Блокировка ===
    @staticmethod
    def locked(username: str) -> tuple[str, HistoryAction]:
        """Формирует сообщение о блокировке."""
        return f"Заблокировано: {username}", HistoryAction.LOCKED

    @staticmethod
    def unlocked() -> tuple[str, HistoryAction]:
        """Формирует сообщение о разблокировке."""
        return "Разблокировано", HistoryAction.UNLOCKED

    # === Распределение ===
    @staticmethod
    def assigned() -> tuple[str, HistoryAction]:
        """Формирует сообщение о распределении."""
        return "ТМЦ распределено", HistoryAction.ASSIGNED

