"""Запрос списка ТМЦ с поиском и фильтрацией."""
from django.db.models import Q
from items.models import Item


class ListItemsQuery:
    """
    Запрос списка ТМЦ с поиском.

    Query — только читает состояние, не изменяет его.
    """

    @staticmethod
    def all(search_query: str = None):
        """
        Получает все ТМЦ с опциональным поиском.

        Args:
            search_query: Строка поиска (по названию или статусу)

        Returns:
            QuerySet Item
        """
        queryset = Item.objects.all().order_by('-id')

        if search_query:
            queryset = queryset.filter(
                Q(name__icontains=search_query) |
                Q(status=search_query)
            )

        return queryset

    @staticmethod
    def with_details(search_query: str = None):
        """
        Получает ТМЦ со всеми связанными данными.

        Args:
            search_query: Строка поиска (опционально)

        Returns:
            QuerySet Item с prefetched связями
        """
        queryset = (
            Item.objects
            .select_related('brigade')
            .order_by('-id')
        )

        if search_query:
            queryset = queryset.filter(
                Q(name__icontains=search_query) |
                Q(status=search_query)
            )

        return queryset

