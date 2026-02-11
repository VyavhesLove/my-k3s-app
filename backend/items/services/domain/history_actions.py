"""Вспомогательные функции для HistoryAction enum.

Все функции возвращают payload dict для хранения в БД.
Текст генерируется динамически через HistoryAction.format(payload).
"""
from ...enums import HistoryAction


# === Подтверждение ТМЦ ===
def accepted_payload(location: str = None) -> dict:
    """Возвращает payload для принятия ТМЦ."""
    payload = {}
    if location:
        payload["location"] = location
    return payload


def rejected_payload(location: str = None) -> dict:
    """Возвращает payload для отклонения ТМЦ."""
    payload = {}
    if location:
        payload["location"] = location
    return payload


def confirmed_payload(comment: str = None) -> dict:
    """Возвращает payload для подтверждения ТМЦ."""
    payload = {}
    if comment:
        payload["comment"] = comment
    return payload


# === Сервисные операции ===
def sent_to_service_payload(reason: str) -> dict:
    """Возвращает payload для отправки в сервис."""
    return {"reason": reason}


def returned_from_service_payload() -> dict:
    """Возвращает payload для возврата из сервиса."""
    return {}


def repair_confirmed_payload() -> dict:
    """Возвращает payload для подтверждения ремонта."""
    return {}


# === Обновление ===
def updated_payload(comment: str = None) -> dict:
    """Возвращает payload для обновления."""
    payload = {}
    if comment:
        payload["comment"] = comment
    return payload


def status_changed_payload(old_status: str, new_status: str) -> dict:
    """Возвращает payload для смены статуса."""
    return {"old_status": old_status, "new_status": new_status}


# === Блокировка ===
def locked_payload(username: str) -> dict:
    """Возвращает payload для блокировки."""
    return {"username": username}


def unlocked_payload() -> dict:
    """Возвращает payload для разблокировки."""
    return {}


# === Распределение ===
def assigned_payload() -> dict:
    """Возвращает payload для распределения."""
    return {}


# === Обратная совместимость (старые методы возвращают отформатированную строку) ===
# ВНИМАНИЕ: Эти методы устарели и будут удалены.
# Используйте payload функции + HistoryAction.format(payload) напрямую.

def accepted(location: str = None) -> tuple[str, HistoryAction]:
    """Формирует сообщение о принятии ТМЦ. Устаревший метод."""
    payload = accepted_payload(location)
    action = HistoryAction.ACCEPTED
    return action.format(payload), action


def rejected(location: str = None) -> tuple[str, HistoryAction]:
    """Формирует сообщение об отклонении ТМЦ. Устаревший метод."""
    payload = rejected_payload(location)
    action = HistoryAction.REJECTED
    return action.format(payload), action


def confirmed(comment: str = None) -> tuple[str, HistoryAction]:
    """Формирует сообщение о подтверждении ТМЦ. Устаревший метод."""
    payload = confirmed_payload(comment)
    action = HistoryAction.CONFIRMED
    return action.format(payload), action


def sent_to_service(reason: str) -> tuple[str, HistoryAction]:
    """Формирует сообщение об отправке в сервис. Устаревший метод."""
    payload = sent_to_service_payload(reason)
    action = HistoryAction.SENT_TO_SERVICE
    return action.format(payload), action


def returned_from_service() -> tuple[str, HistoryAction]:
    """Формирует сообщение о возврате из сервиса. Устаревший метод."""
    payload = returned_from_service_payload()
    action = HistoryAction.RETURNED_FROM_SERVICE
    return action.format(payload), action


def repair_confirmed() -> tuple[str, HistoryAction]:
    """Формирует сообщение о подтверждении ремонта. Устаревший метод."""
    payload = repair_confirmed_payload()
    action = HistoryAction.REPAIR_CONFIRMED
    return action.format(payload), action


def updated(comment: str = None) -> tuple[str, HistoryAction]:
    """Формирует сообщение об обновлении. Устаревший метод."""
    payload = updated_payload(comment)
    action = HistoryAction.UPDATED
    return action.format(payload), action


def status_changed(old_status: str, new_status: str) -> tuple[str, HistoryAction]:
    """Формирует сообщение о смене статуса. Устаревший метод."""
    payload = status_changed_payload(old_status, new_status)
    action = HistoryAction.STATUS_CHANGED
    return action.format(payload), action


def locked(username: str) -> tuple[str, HistoryAction]:
    """Формирует сообщение о блокировке. Устаревший метод."""
    payload = locked_payload(username)
    action = HistoryAction.LOCKED
    return action.format(payload), action


def unlocked() -> tuple[str, HistoryAction]:
    """Формирует сообщение о разблокировке. Устаревший метод."""
    payload = unlocked_payload()
    action = HistoryAction.UNLOCKED
    return action.format(payload), action


def assigned() -> tuple[str, HistoryAction]:
    """Формирует сообщение о распределении. Устаревший метод."""
    payload = assigned_payload()
    action = HistoryAction.ASSIGNED
    return action.format(payload), action

