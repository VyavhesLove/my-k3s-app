"""Запрос получения истории ТМЦ."""
from django.utils import timezone
from datetime import timedelta
from items.models import ItemHistory


class GetItemHistoryQuery:
    """
    Запрос получения истории ТМЦ.

    Query — только читает состояние, не изменяет его.
    """

    @staticmethod
    def all(item_id: int, limit: int = None):
        """
        Получает всю историю ТМЦ.

        Args:
            item_id: ID ТМЦ
            limit: Ограничение количества записей (опционально)

        Returns:
            QuerySet ItemHistory
        """
        queryset = (
            ItemHistory.objects
            .filter(item_id=item_id)
            .select_related('user', 'location')
            .order_by('-timestamp')
        )

        if limit:
            queryset = queryset[:limit]

        return queryset

    @staticmethod
    def recent(item_id: int, days: int = 30):
        """
        Получает историю за последние N дней.

        Args:
            item_id: ID ТМЦ
            days: Количество дней

        Returns:
            QuerySet ItemHistory
        """
        since = timezone.now() - timedelta(days=days)

        return (
            ItemHistory.objects
            .filter(item_id=item_id, timestamp__gte=since)
            .select_related('user', 'location')
            .order_by('-timestamp')
        )

    @staticmethod
    def with_action(item_id: int, action_pattern: str):
        """
        Получает историю с действиями, содержащими паттерн.

        Args:
            item_id: ID ТМЦ
            action_pattern: Паттерн для поиска в action

        Returns:
            QuerySet ItemHistory
        """
        return (
            ItemHistory.objects
            .filter(item_id=item_id, action__icontains=action_pattern)
            .select_related('user', 'location')
            .order_by('-timestamp')
        )

