"""Запрос аналитики по ТМЦ."""
from django.db.models import Count, Q
from items.models import Item


class GetAnalyticsQuery:
    """
    Запрос аналитики по ТМЦ.

    Query — только читает состояние, не изменяет его.
    """

    @staticmethod
    def filtered(name: str = None, brand: str = None, location: str = None):
        """
        Получает аналитику с фильтрами.

        Args:
            name: Фильтр по названию
            brand: Фильтр по бренду
            location: Фильтр по локации

        Returns:
            dict: {
                by_brand: list,
                by_location: list,
                by_status: list,
                details: QuerySet
            }
        """
        filters = Q()
        if name:
            filters &= Q(name__icontains=name)
        if brand:
            filters &= Q(brand__icontains=brand)
        if location:
            filters &= Q(location__icontains=location)

        queryset = Item.objects.filter(filters)

        # Агрегации
        by_brand = list(
            queryset.values('brand')
            .annotate(value=Count('id'))
            .order_by('-value')
        )
        by_location = list(
            queryset.values('location')
            .annotate(value=Count('id'))
            .order_by('-value')
        )
        by_status = list(
            queryset.values('status')
            .annotate(value=Count('id'))
            .order_by('-value')
        )

        # Заменяем пустые значения для UI
        for item in by_brand:
            item['brand'] = item['brand'] or 'Не указан'
        for item in by_location:
            item['location'] = item['location'] or 'Не указана'

        return {
            "by_brand": by_brand,
            "by_location": by_location,
            "by_status": by_status,
            "details": queryset.order_by('-id')
        }

    @staticmethod
    def all():
        """
        Получает полную аналитику без фильтров.

        Returns:
            dict с полной аналитикой
        """
        return GetAnalyticsQuery.filtered()

