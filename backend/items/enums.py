from django.db import models


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


# Отдельный класс для шаблонов
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
            try:
                return template.format(**payload)
            except KeyError:
                # Если в payload нет нужных ключей, возвращаем шаблон как есть
                return template
        return template

