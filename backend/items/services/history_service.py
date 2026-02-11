"""Централизованный сервис для создания записей истории."""
from django.db import models
from ..models import Item, ItemHistory, Location


class HistoryService:
    """Сервис для работы с историей ТМЦ."""

    @staticmethod
    def create(
        item: Item,
        action: str,
        user=None,
        comment: str = None,
        location_name: str = None,
    ) -> ItemHistory:
        """
        Создаёт запись в истории ТМЦ.

        Args:
            item: Объект ТМЦ
            action: Текст действия
            user: Пользователь (объект User или username)
            comment: Дополнительный комментарий
            location_name: Название локации

        Returns:
            Созданный объект ItemHistory
        """
        location = None
        if location_name:
            location, _ = Location.objects.get_or_create(name=location_name)

        # Определяем username для совместимости
        if hasattr(user, 'username'):
            user_obj = user
        elif user:
            user_obj = None  # FK нельзя создать с username
        else:
            user_obj = None

        return ItemHistory.objects.create(
            item=item,
            action=action,
            comment=comment,
            user=user_obj,
            location=location,
        )

    @staticmethod
    def get_first_assignment(item: Item):
        """
        Получает первую запись о распределении ТМЦ.

        Args:
            item: Объект ТМЦ

        Returns:
            ItemHistory или None
        """
        return (
            ItemHistory.objects.filter(item=item, action="assigned")
            .order_by("timestamp")
            .first()
        )

