from decimal import Decimal
from django.db import models


class HistoryActionTemplates:
    """Шаблоны для генерации текста из payload"""
    TEMPLATES = {
        "accepted": "ТМЦ принято. Объект - {location}",
        "rejected": "ТМЦ не принято. Возвращено на объект - {location}",
        "sent_to_service": "Отправлено в сервис. Причина: {reason}. Ожидание подтверждения.",
        "returned_from_service": "Возвращено из сервиса",
        "repair_confirmed": "Ремонт подтверждён",
        "updated": "Обновление информации. Комментарий: {comment}",
        "status_changed": "Смена статуса: {old_status} → {new_status}",
        "locked": "Заблокировано: {username}",
        "unlocked": "Разблокировано",
        "assigned": "ТМЦ распределено",
        "confirmed": "ТМЦ подтверждено. Комментарий: {comment}",
        "written_off": "Списание ТМЦ. Причина: {reason}. Сумма: {amount}",
        "cancelled_write_off": "Отмена списания ТМЦ. Запись №{write_off_id}",
    }

    @classmethod
    def get_template(cls, action_value: str) -> str:
        """Возвращает шаблон для данного типа действия."""
        return cls.TEMPLATES.get(action_value, action_value)

    @classmethod
    def format(cls, action_value: str, payload: dict = None) -> str:
        """Форматирует текст действия из payload.

        Args:
            action_value: Значение действия (например, "accepted")
            payload: Словарь с параметрами для подстановки в шаблон

        Returns:
            Отформатированный текст действия
        """
        template = cls.get_template(action_value)
        if payload:
            # Проверяем, есть ли в payload все ключи из шаблона
            template_keys = cls._extract_template_keys(template)
            
            # Для write_off_id пустая строка трактуется как отсутствующий ключ
            missing_keys = []
            for k in template_keys:
                if k not in payload:
                    missing_keys.append(k)
                elif k in _EMPTY_AS_MISSING_KEYS and payload[k] in (None, ""):
                    missing_keys.append(k)
            
            if missing_keys:
                # Есть отсутствующие ключи - возвращаем шаблон как есть
                return template
            
            try:
                return template.format(**payload)
            except (KeyError, ValueError):
                return template
        return template
    
    @staticmethod
    def _extract_template_keys(template: str) -> set:
        """Извлекает все ключи из шаблона."""
        import re
        return set(re.findall(r'\{(\w+)\}', template))


class ItemStatus(models.TextChoices):
    """Статусы для модели Item (ТМЦ)"""
    CREATED = "created", "Создано"
    AT_WORK = "at_work", "В работе"
    IN_REPAIR = "in_repair", "В ремонте"
    ISSUED = "issued", "Выдано"
    AVAILABLE = "available", "Доступно"
    CONFIRM = "confirm", "Требует подтверждения"
    CONFIRM_REPAIR = "confirm_repair", "Подтвердить ремонт"
    WRITTEN_OFF = "written_off", "Списано"


# Обязательные ключи и значения по умолчанию для payload в HistoryAction.build()
# Используем строковые ключи, так как Django TextChoices не позволяет dict внутри класса
_REQUIRED_PAYLOAD_KEYS = {
    "written_off": {"reason": "", "amount": Decimal("0")},
    "cancelled_write_off": {"write_off_id": ""},
}

# Ключи, для которых пустая строка трактуется как отсутствующий параметр
_EMPTY_AS_MISSING_KEYS = {"write_off_id"}


class HistoryAction(models.TextChoices):
    """Типы действий для истории ТМЦ (используются для фильтрации и группировки)."""
    ACCEPTED = "accepted", "ТМЦ принято"
    REJECTED = "rejected", "ТМЦ не принято"
    SENT_TO_SERVICE = "sent_to_service", "Отправлено в сервис"
    RETURNED_FROM_SERVICE = "returned_from_service", "Возвращено из сервиса"
    REPAIR_CONFIRMED = "repair_confirmed", "Ремонт подтверждён"
    UPDATED = "updated", "Обновление информации"
    STATUS_CHANGED = "status_changed", "Смена статуса"
    LOCKED = "locked", "Заблокировано"
    UNLOCKED = "unlocked", "Разблокировано"
    ASSIGNED = "assigned", "ТМЦ распределено"
    CONFIRMED = "confirmed", "ТМЦ подтверждено"
    WRITTEN_OFF = "written_off", "Списано"
    CANCELLED_WRITE_OFF = "cancelled_write_off", "Отмена списания"

    def build(self, **kwargs) -> tuple:
        """Создаёт кортеж (action_type, action_text, payload) для сохранения в историю.

        Пример использования:
            HistoryAction.ACCEPTED.build(location="Склад 1")
            # Возвращает: ("accepted", "ТМЦ принято. Объект - Склад 1", {"location": "Склад 1"})

        Args:
            **kwargs: Параметры для подстановки в шаблон (location, reason, comment, etc.)

        Returns:
            tuple: (action_type, action_text, payload)
        """
        # Получаем обязательные ключи и значения по умолчанию для этого типа действия
        default_keys = _REQUIRED_PAYLOAD_KEYS.get(self.value, {})

        # Payload содержит defaults + переданные параметры
        if kwargs:
            payload = {**default_keys, **kwargs}
            # Преобразуем write_off_id в строку если передан (включая пустую строку)
            if "write_off_id" in payload:
                payload["write_off_id"] = str(payload["write_off_id"])
            format_payload = payload.copy()
        else:
            payload = default_keys.copy()
            format_payload = {}

        action_text = HistoryActionTemplates.format(self.value, format_payload)
        return self.value, action_text, payload

