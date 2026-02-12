"""Запрос счетчиков статусов."""
from django.db.models import Count
from items.models import Item
from items.enums import ItemStatus


class GetStatusCountersQuery:
    """
    Запрос счетчиков статусов для виджета уведомлений.

    Query — только читает состояние, не изменяет его.
    """

    @staticmethod
    def all():
        """
        Получает количество ТМЦ по каждому статусу.

        Returns:
            dict: {status: count}
        """
        counts_query = Item.objects.values('status').annotate(total=Count('id'))
        return {item['status']: item['total'] for item in counts_query}

    @staticmethod
    def summary():
        """
        Получает сводку для UI.

        Returns:
            dict: {
                to_receive: count (CONFIRM),
                to_repair: count (CONFIRM_REPAIR),
                issued: count (ISSUED + AT_WORK)
            }
        """
        raw_data = GetStatusCountersQuery.all()

        return {
            "to_receive": raw_data.get(ItemStatus.CONFIRM, 0),
            "to_repair": raw_data.get(ItemStatus.CONFIRM_REPAIR, 0),
            "issued": raw_data.get(ItemStatus.ISSUED, 0) + raw_data.get(ItemStatus.AT_WORK, 0)
        }

