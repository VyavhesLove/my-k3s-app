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

