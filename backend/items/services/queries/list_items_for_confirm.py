"""Запрос списка ТМЦ для подтверждения."""
from items.models import Item
from items.enums import ItemStatus


class ListItemsForConfirmQuery:
    """
    Запрос списка ТМЦ, ожидающих подтверждения.

    Query — только читает состояние, не изменяет его.
    """

    @staticmethod
    def all():
        """
        Получает все ТМЦ со статусом CONFIRM.

        Returns:
            QuerySet Item
        """
        return (
            Item.objects
            .filter(status=ItemStatus.CONFIRM)
            .select_related('brigade')
            .order_by('-id')
        )

    @staticmethod
    def by_location(location_name: str):
        """
        Получает ТМЦ для подтверждения по локации.

        Args:
            location_name: Название локации

        Returns:
            QuerySet Item
        """
        return (
            Item.objects
            .filter(status=ItemStatus.CONFIRM, location=location_name)
            .select_related('brigade')
            .order_by('-id')
        )

    @staticmethod
    def count() -> int:
        """
        Возвращает количество ТМЦ, ожидающих подтверждения.

        Returns:
            Количество
        """
        return Item.objects.filter(status=ItemStatus.CONFIRM).count()

