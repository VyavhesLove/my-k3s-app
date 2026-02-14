"""Query слой для получения списка записей о списании ТМЦ."""
from datetime import date
from typing import Optional
from django.db.models import QuerySet
from ...models import WriteOffRecord, Location


class ListWriteOffsQuery:
    """
    Query для получения списка записей о списании с фильтрацией.
    
    Поддерживает фильтрацию по:
    - status (is_cancelled): активные/отменённые записи
    - location: название локации
    - date: дата списания (date_written_off)
    """
    
    @staticmethod
    def all(
        is_cancelled: Optional[bool] = None,
        location: Optional[str] = None,
        date_written_off: Optional[date] = None,
    ) -> QuerySet[WriteOffRecord]:
        """
        Получить список записей о списании с фильтрацией.
        
        Args:
            is_cancelled: Фильтр по статусу отмены (None = все, True = отменённые, False = активные)
            location: Фильтр по названию локации (частичное совпадение)
            date_written_off: Фильтр по дате списания
            
        Returns:
            QuerySet с отфильтрованными записями о списании
        """
        queryset = WriteOffRecord.objects.select_related(
            'item', 'location', 'created_by'
        ).order_by('-created_at')
        
        # Фильтрация по is_cancelled
        # По умолчанию (is_cancelled=None) показываем все записи (активные + отменённые)
        if is_cancelled is not None:
            queryset = queryset.filter(is_cancelled=is_cancelled)
        
        # Фильтрация по location (частичное совпадение по названию)
        if location:
            queryset = queryset.filter(location__name__icontains=location)
        
        # Фильтрация по дате списания
        if date_written_off:
            queryset = queryset.filter(date_written_off=date_written_off)
        
        return queryset
    
    @staticmethod
    def by_id(write_off_id: int) -> WriteOffRecord:
        """
        Получить запись о списании по ID.
        
        Args:
            write_off_id: ID записи о списании
            
        Returns:
            Запись о списании
            
        Raises:
            WriteOffRecord.DoesNotExist: Если запись не найдена
        """
        return WriteOffRecord.objects.select_related(
            'item', 'location', 'created_by'
        ).get(id=write_off_id)

