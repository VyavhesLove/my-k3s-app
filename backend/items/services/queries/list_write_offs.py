"""Query слой для получения списка списаний ТМЦ."""
from datetime import date
from typing import Optional
from django.db.models import QuerySet, Q, Exists, OuterRef
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
    
    Возвращает WriteOffRecord для поддержки множественных записей на один item.
    """
    
    @staticmethod
    def all(
        is_cancelled: Optional[bool] = None,
        location: Optional[str] = None,
        date_written_off: Optional[date] = None,
        search: Optional[str] = None,
    ) -> QuerySet:
        """
        Получить список записей о списании.
        
        Args:
            is_cancelled: Фильтр по статусу отмены записи списания (None = все, True = отменённые, False = активные)
            location: Фильтр по названию локации (частичное совпадение)
            date_written_off: Фильтр по дате списания
            search: Поиск по названию или серийному номеру ТМЦ
            
        Returns:
            QuerySet с записями WriteOffRecord
        """
        # Начинаем с WriteOffRecord
        queryset = WriteOffRecord.objects.select_related(
            'item', 'location', 'created_by'
        ).order_by('-id')
        
        # Фильтрация по is_cancelled
        if is_cancelled is not None:
            queryset = queryset.filter(is_cancelled=is_cancelled)
        
        # Фильтрация по локации (через связанную таблицу или поле item.location)
        if location:
            queryset = queryset.filter(
                Q(location__name__icontains=location) |
                Q(item__location__icontains=location)
            )
        
        # Фильтрация по дате списания
        if date_written_off:
            queryset = queryset.filter(date_written_off=date_written_off)
        
        # Фильтрация по поиску (название или серийный номер ТМЦ)
        if search:
            queryset = queryset.filter(
                Q(item__name__icontains=search) | 
                Q(item__serial__icontains=search)
            )
        
        return queryset
    
    @staticmethod
    def by_id(write_off_id: int) -> Item:
        """
        Получить ТМЦ по ID записи о списании.
        
        Args:
            write_off_id: ID записи WriteOffRecord
            
        Returns:
            ТМЦ с записью о списании
            
        Raises:
            WriteOffRecord.DoesNotExist: Если запись о списании не найдена
        """
        write_off = WriteOffRecord.objects.get(id=write_off_id)
        return write_off.item

