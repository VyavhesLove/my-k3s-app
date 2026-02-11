"""Константы действий для истории ТМЦ."""


class HistoryActions:
    """
    Стандартизированные строки действий для записи в историю.
    Используются для обеспечения консистентности в UI и фильтрации.
    """

    # === Подтверждение ТМЦ ===
    ACCEPTED = "ТМЦ принято"
    REJECTED = "ТМЦ не принято"

    # === Сервисные операции ===
    SENT_TO_SERVICE = "Отправлено в сервис"
    RETURNED_FROM_SERVICE = "Возвращено из сервиса"
    REPAIR_CONFIRMED = "Ремонт подтверждён"

    # === Обновление ===
    UPDATED = "Обновление информации"
    STATUS_CHANGED = "Смена статуса: {old_status} → {new_status}"

    # === Блокировка ===
    LOCKED = "Заблокировано: {username}"
    UNLOCKED = "Разблокировано"

    # === Распределение ===
    ASSIGNED = "ТМЦ распределено"

    @classmethod
    def sent_to_service(cls, reason: str) -> str:
        """Формирует сообщение об отправке в сервис."""
        return f"{cls.SENT_TO_SERVICE}. Причина: {reason}. Ожидание подтверждения."

    @classmethod
    def rejected_with_location(cls, location: str) -> str:
        """Формирует сообщение об отклонении с возвратом на локацию."""
        return f"{cls.REJECTED}. Возвращено на объект - {location}"

    @classmethod
    def status_changed(cls, old_status: str, new_status: str) -> str:
        """Формирует сообщение о смене статуса."""
        return cls.STATUS_CHANGED.format(old_status=old_status, new_status=new_status)

    @classmethod
    def locked(cls, username: str) -> str:
        """Формирует сообщение о блокировке."""
        return cls.LOCKED.format(username=username)

