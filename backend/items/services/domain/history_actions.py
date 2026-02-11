"""Вспомогательные функции для работы с историей действий.

Все функции возвращают кортеж (action_type, action_text, payload) для хранения в БД.
"""

from items.enums import HistoryAction, HistoryActionTemplates


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
def assigned_payload(location: str = None) -> dict:
    """Возвращает payload для распределения."""
    payload = {}
    if location:
        payload["location"] = location
    return payload


# === Генерация полного текста действия ===
def format_action(action_type: str, payload: dict = None) -> str:
    """Форматирует полный текст действия из типа и payload."""
    return HistoryActionTemplates.format(action_type, payload)


# === Функции для удобства (возвращают кортеж для сохранения в ItemHistory) ===
def create_accepted(location: str = None) -> tuple:
    """Создать данные для принятия ТМЦ."""
    payload = accepted_payload(location)
    action_text = format_action(HistoryAction.ACCEPTED.value, payload)
    return HistoryAction.ACCEPTED.value, action_text, payload


def create_rejected(location: str = None) -> tuple:
    """Создать данные для отклонения ТМЦ."""
    payload = rejected_payload(location)
    action_text = format_action(HistoryAction.REJECTED.value, payload)
    return HistoryAction.REJECTED.value, action_text, payload


def create_sent_to_service(reason: str) -> tuple:
    """Создать данные для отправки в сервис."""
    payload = sent_to_service_payload(reason)
    action_text = format_action(HistoryAction.SENT_TO_SERVICE.value, payload)
    return HistoryAction.SENT_TO_SERVICE.value, action_text, payload


def create_returned_from_service() -> tuple:
    """Создать данные для возврата из сервиса."""
    payload = returned_from_service_payload()
    action_text = format_action(HistoryAction.RETURNED_FROM_SERVICE.value, payload)
    return HistoryAction.RETURNED_FROM_SERVICE.value, action_text, payload


def create_status_changed(old_status: str, new_status: str) -> tuple:
    """Создать данные для смены статуса."""
    payload = status_changed_payload(old_status, new_status)
    action_text = format_action(HistoryAction.STATUS_CHANGED.value, payload)
    return HistoryAction.STATUS_CHANGED.value, action_text, payload


def create_locked(username: str) -> tuple:
    """Создать данные для блокировки."""
    payload = locked_payload(username)
    action_text = format_action(HistoryAction.LOCKED.value, payload)
    return HistoryAction.LOCKED.value, action_text, payload


def create_updated(comment: str = None) -> tuple:
    """Создать данные для обновления."""
    payload = updated_payload(comment)
    action_text = format_action(HistoryAction.UPDATED.value, payload)
    return HistoryAction.UPDATED.value, action_text, payload


def create_assigned(location: str = None) -> tuple:
    """Создать данные для распределения."""
    payload = assigned_payload(location)
    action_text = format_action(HistoryAction.ASSIGNED.value, payload)
    return HistoryAction.ASSIGNED.value, action_text, payload


def create_repair_confirmed() -> tuple:
    """Создать данные для подтверждения ремонта."""
    payload = repair_confirmed_payload()
    action_text = format_action(HistoryAction.REPAIR_CONFIRMED.value, payload)
    return HistoryAction.REPAIR_CONFIRMED.value, action_text, payload


def create_unlocked() -> tuple:
    """Создать данные для разблокировки."""
    payload = unlocked_payload()
    action_text = format_action(HistoryAction.UNLOCKED.value, payload)
    return HistoryAction.UNLOCKED.value, action_text, payload


def create_confirmed(comment: str = None) -> tuple:
    """Создать данные для подтверждения ТМЦ."""
    payload = confirmed_payload(comment)
    action_text = format_action(HistoryAction.CONFIRMED.value, payload)
    return HistoryAction.CONFIRMED.value, action_text, payload


class HistoryActionsFormatter:
    """Класс-помощник для форматирования действий истории"""
    
    @staticmethod
    def accepted(location: str = None) -> tuple:
        return create_accepted(location)
    
    @staticmethod
    def rejected(location: str = None) -> tuple:
        return create_rejected(location)
    
    @staticmethod
    def sent_to_service(reason: str) -> tuple:
        return create_sent_to_service(reason)
    
    @staticmethod
    def returned_from_service() -> tuple:
        return create_returned_from_service()
    
    @staticmethod
    def repair_confirmed() -> tuple:
        return create_repair_confirmed()
    
    @staticmethod
    def status_changed(old_status: str, new_status: str) -> tuple:
        return create_status_changed(old_status, new_status)
    
    @staticmethod
    def locked(username: str) -> tuple:
        return create_locked(username)
    
    @staticmethod
    def unlocked() -> tuple:
        return create_unlocked()
    
    @staticmethod
    def updated(comment: str = None) -> tuple:
        return create_updated(comment)
    
    @staticmethod
    def assigned(location: str = None) -> tuple:
        return create_assigned(location)
    
    @staticmethod
    def confirmed(comment: str = None) -> tuple:
        return create_confirmed(comment)
    
    @staticmethod
    def format(action_type: str, payload: dict = None) -> str:
        """Форматирует текст действия"""
        return format_action(action_type, payload)
    
    @staticmethod
    def get_template(action_value: str) -> str:
        """Получить шаблон для действия"""
        return HistoryActionTemplates.get_template(action_value)

