"""Запрос получения одного ТМЦ по ID."""
from ..models import Item


class GetItemQuery:
    """
    Запрос получения одного ТМЦ.

    Query — только читает состояние, не изменяет его.
    """

    @staticmethod
    def by_id(item_id: int) -> Item:
        """
        Получает ТМЦ по ID.

        Args:
            item_id: ID ТМЦ

        Returns:
            Объект Item или None
        """
        try:
            return Item.objects.select_related('brigade').get(pk=item_id)
        except Item.DoesNotExist:
            return None

    @staticmethod
    def with_details(item_id: int) -> Item:
        """
        Получает ТМЦ со всеми связанными данными.

        Args:
            item_id: ID ТМЦ

        Returns:
            Объект Item с prefetched history или None
        """
        try:
            return (
                Item.objects
                .select_related('brigade')
                .prefetch_related('history__user', 'history__location')
                .get(pk=item_id)
            )
        except Item.DoesNotExist:
            return None

