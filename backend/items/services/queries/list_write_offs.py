"""Query слой для получения списка списаний ТМЦ."""
from datetime import date
from typing import Optional
from django.db.models import QuerySet, Q
from ...models import WriteOffRecord, Item, Location
from ...enums import ItemStatus


class ListWriteOffsQuery:
    """
    Query для получения списка списаний ТМЦ.
    
    Поддерживает фильтрацию по:
    - status (is_cancelled): активные/отменённые записи
    - location: название локации
    - date: дата списания (date_written_off)
    - search: поиск по названию или серийному номеру ТМЦ
    
    ВАЖНО: Теперь ищет ТМЦ со статусом WRITTEN_OFF, а не записи WriteOffRecord.
    """
    
    @staticmethod
    def all(
        is_cancelled: Optional[bool] = None,
        location: Optional[str] = None,
        date_written_off: Optional[date] = None,
        search: Optional[str] = None,
    ) -> QuerySet:
        """
        Получить список ТМЦ со статусом WRITTEN_OFF (списано).
        
        Args:
            is_cancelled: Фильтр по статусу отмены записи списания (None = все, True = отменённые, False = активные)
            location: Фильтр по названию локации (частичное совпадение)
            date_written_off: Фильтр по дате списания
            search: Поиск по названию или серийному номеру ТМЦ
            
        Returns:
            QuerySet с ТМЦ со статусом WRITTEN_OFF
        """
        # Начинаем с ТМЦ со статусом WRITTEN_OFF
        queryset = Item.objects.filter(
            status=ItemStatus.WRITTEN_OFF
        ).select_related(
            'brigade'
        ).prefetch_related(
            'write_off_records'
        ).order_by('-id')
        
        # Фильтрация по поиску (название или серийный номер)
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) | 
                Q(serial__icontains=search)
            )
        
        # Фильтрация по локации
        if location:
            queryset = queryset.filter(location__icontains=location)
        
        return queryset
    
    @staticmethod
    def by_id(write_off_id: int) -> Item:
        """
        Получить ТМЦ со статусом WRITTEN_OFF по ID.
        
        Args:
            write_off_id: ID ТМЦ
            
        Returns:
            ТМЦ со статусом WRITTEN_OFF
            
        Raises:
            Item.DoesNotExist: Если ТМЦ не найдено или не имеет статуса WRITTEN_OFF
        """
        return Item.objects.get(id=write_off_id, status=ItemStatus.WRITTEN_OFF)

