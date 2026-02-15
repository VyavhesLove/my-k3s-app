"""API views для CRUD операций списания ТМЦ (writeoffs)."""
from datetime import date
from decimal import Decimal
from drf_spectacular.utils import extend_schema
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from django.core.exceptions import ObjectDoesNotExist

from ..serializers import WriteOffCreateSerializer, WriteOffRecordSerializer
from ..permissions import IsStorekeeper
from ..services.queries import ListWriteOffsQuery
from ..services.commands import WriteOffCommand, CancelWriteOffCommand
from ..utils import api_response, api_error
from ..exceptions import DomainNotFoundError, DomainValidationError
from ..models import Location, Item


@extend_schema(
    methods=['GET'],
    description="Получить список записей о списании с фильтрацией",
    responses={200: WriteOffRecordSerializer(many=True)}
)
@extend_schema(
    methods=['POST'],
    description="Создать запись о списании ТМЦ",
    request=WriteOffCreateSerializer,
    responses={201: WriteOffRecordSerializer}
)
@api_view(['GET', 'POST'])
@permission_classes([IsStorekeeper])
def write_off_list(request):
    """
    GET: список ТМЦ со статусом 'written_off' (списано) с фильтрацией
    POST: создать запись о списании ТМЦ
    
    Фильтры (GET query params):
    - is_cancelled: true/false (активные/отменённые записи)
    - location: частичное совпадение по названию локации
    - date: дата списания (date_written_off)
    - search: поиск по названию или серийному номеру ТМЦ
    
    Только для кладовщиков и администраторов.
    """
    if request.method == 'GET':
        # Получаем параметры фильтрации
        is_cancelled = request.GET.get('is_cancelled')
        if is_cancelled is not None:
            is_cancelled = is_cancelled.lower() == 'true'
        
        location = request.GET.get('location')
        search = request.GET.get('search')
        date_str = request.GET.get('date')
        date_written_off = None
        if date_str:
            try:
                date_written_off = date.fromisoformat(date_str)
            except ValueError:
                pass
        
        # Получаем ТМЦ со статусом written_off
        queryset = ListWriteOffsQuery.all(
            is_cancelled=is_cancelled,
            location=location,
            date_written_off=date_written_off,
            search=search
        )
        
        serializer = WriteOffRecordSerializer(queryset, many=True)
        return api_response(data={"write_offs": serializer.data})
    
    if request.method == 'POST':
        serializer = WriteOffCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # Выполняем списание через команду
        try:
            item_id, write_off_id = WriteOffCommand.execute(
                item_id=serializer.validated_data["item_id"],
                invoice_number=serializer.validated_data["invoice_number"],
                repair_cost=serializer.validated_data.get("repair_cost", Decimal("0")),
                date_to_service=serializer.validated_data.get("date_to_service"),
                date_written_off=serializer.validated_data.get("date_written_off"),
                description=serializer.validated_data.get("description", ""),
                user=request.user
            )
        except ObjectDoesNotExist:
            return api_error(error="ТМЦ не найдено", status_code=400)
        
        # Получаем созданную запись для ответа
        from ..models import WriteOffRecord
        write_off_record = WriteOffRecord.objects.select_related(
            'item', 'location', 'created_by'
        ).get(id=write_off_id)
        
        return api_response(
            data=WriteOffRecordSerializer(write_off_record).data,
            message="ТМЦ списано",
            status_code=201
        )


@extend_schema(
    methods=['POST'],
    description="Отменить запись о списании ТМЦ",
    responses={200: WriteOffRecordSerializer}
)
@api_view(['POST'])
@permission_classes([IsStorekeeper])
def write_off_cancel(request, write_off_id):
    """
    Отменить запись о списании ТМЦ.
    
    Только для кладовщиков и администраторов.
    """
    from ..models import WriteOffRecord
    
    # Получаем запись о списании чтобы найти связанный item
    try:
        write_off_record = WriteOffRecord.objects.select_related('item').get(id=write_off_id)
    except WriteOffRecord.DoesNotExist:
        return api_error(error=f"Запись о списании с ID {write_off_id} не найдена", status_code=404)
    
    # Выполняем отмену списания через команду (передаём item_id)
    try:
        CancelWriteOffCommand.execute(
            item_id=write_off_record.item.id,
            user=request.user
        )
    except DomainValidationError as e:
        return api_error(error=str(e), status_code=400)
    except DomainNotFoundError as e:
        return api_error(error=str(e), status_code=404)
    
    # Получаем обновлённую запись о списании для ответа
    write_off_record.refresh_from_db()
    return api_response(
        data=WriteOffRecordSerializer(write_off_record).data,
        message="Списание отменено"
    )


@extend_schema(
    methods=['GET'],
    description="Получить доступные опции для фильтрации списаний",
    responses={200: {
        "type": "object",
        "properties": {
            "locations": {"type": "array", "items": {"type": "object", "properties": {"id": {"type": "integer"}, "name": {"type": "string"}}}},
            "names": {"type": "array", "items": {"type": "string"}}
        }
    }}
)
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def write_off_filter_options(request):
    """
    Получить доступные опции для фильтрации списаний.
    
    Returns:
        - locations: список локаций, где есть списания
        - names: список уникальных названий ТМЦ в списаниях
    """
    # Получаем уникальные локации, где есть записи о списании
    locations = list(
        Location.objects.filter(
            write_off_records__isnull=False
        ).distinct().values('id', 'name')
    )
    
    # Получаем уникальные названия ТМЦ из списаний
    names = list(
        Item.objects.filter(
            write_off_records__isnull=False
        ).values_list('name', flat=True).distinct()
    )
    
    return api_response(data={
        "locations": locations,
        "names": sorted(names)
    })

