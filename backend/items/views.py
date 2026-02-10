from django.db.models import Count, Q
from drf_spectacular.utils import extend_schema
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from rest_framework.views import APIView

from .models import Item, Location, Brigade, ItemHistory
from .serializers import ItemSerializer, LocationSerializer, StatusCounterSerializer, BrigadeSerializer, ConfirmTMCSerializer
from .services import ItemLockService, ConfirmTMCService, HistoryService, ItemServiceService, ItemWorkflowService, ItemUpdateService
from .enums import ItemStatus


# --- ПРЕДСТАВЛЕНИЯ (VIEWS) ---
@extend_schema(
    methods=['GET'],
    description="Получить список ТМЦ с поиском",
    responses={200: ItemSerializer(many=True)}
)
@extend_schema(
    methods=['POST'],
    description="Создать новый предмет",
    request=ItemSerializer,
    responses={201: ItemSerializer}
)
@api_view(['GET', 'POST'])
def item_list(request):
    """GET: список items, POST: создать item"""
    if request.method == 'GET':
        search_query = request.GET.get('search', '')
        queryset = Item.objects.all().order_by('-id')
        
        if search_query:
            # Поиск по названию или точному английскому ключу статуса
            queryset = queryset.filter(
                Q(name__icontains=search_query) | 
                Q(status=search_query)
            )
        
        serializer = ItemSerializer(queryset, many=True)
        return Response({"items": serializer.data})
    
    if request.method == 'POST':
        serializer = ItemSerializer(data=request.data)
        if serializer.is_valid():
            item = serializer.save()
            return Response(ItemSerializer(item).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@extend_schema(
    methods=['PUT', 'PATCH'],
    description="Обновить ТМЦ (частичное или полное обновление)",
    request=ItemSerializer,
    responses={200: ItemSerializer}
)
@extend_schema(methods=['DELETE'], description="Удалить ТМЦ")
@api_view(['PUT', 'PATCH', 'DELETE'])
def item_detail(request, item_id):
    """PUT/PATCH: обновить, DELETE: удалить"""
    try:
        item = Item.objects.get(id=item_id)
    except Item.DoesNotExist:
        return Response({"error": "Not found"}, status=status.HTTP_404_NOT_FOUND)

    if request.method in ['PUT', 'PATCH']:
        try:
            item = ItemUpdateService.update(item_id, request.data, request.user)
            return Response(ItemSerializer(item).data)
        except ValueError as e:
            return Response({"error": str(e)}, status=423)
            
    if request.method == 'DELETE':
        item.delete()
        return Response({"status": "success"}, status=status.HTTP_200_OK)


@extend_schema(
    methods=['GET'],
    description="Счетчики статусов для уведомлений",
    responses={200: StatusCounterSerializer}
)
@api_view(['GET'])
def get_status_counters(request):
    """Получить счетчики статусов для виджета уведомлений"""
    counts_query = Item.objects.values('status').annotate(total=Count('id'))
    raw_data = {item['status']: item['total'] for item in counts_query}
    
    return Response({
        "to_receive": raw_data.get(ItemStatus.CONFIRM, 0), 
        "to_repair": raw_data.get(ItemStatus.CONFIRM_REPAIR, 0),
        "issued": raw_data.get(ItemStatus.ISSUED, 0) + raw_data.get(ItemStatus.AT_WORK, 0)
    })


@extend_schema(responses={200: LocationSerializer(many=True)})
@api_view(['GET'])
def location_list(request):
    """Список локаций для выпадающих списков"""
    locations = Location.objects.all().order_by('name')
    serializer = LocationSerializer(locations, many=True)
    return Response({"locations": serializer.data})


@extend_schema(methods=['GET'], responses=BrigadeSerializer(many=True))
@extend_schema(methods=['POST'], request=BrigadeSerializer, responses=BrigadeSerializer)
@api_view(['GET', 'POST'])
def brigade_list(request):
    if request.method == 'GET':
        brigades = Brigade.objects.all().order_by('name')
        return Response({"brigades": BrigadeSerializer(brigades, many=True).data})
    
    if request.method == 'POST':
        serializer = BrigadeSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# АНАЛИТИКА

@extend_schema(
    description="Аналитика: группировка по брендам, локациям и статусам",
    responses={200: dict}
)
@api_view(['GET'])
def get_analytics(request):
    """Аналитика через Django ORM"""
    name_f = request.GET.get('name', '')
    brand_f = request.GET.get('brand', '')
    loc_f = request.GET.get('location', '')

    # Применяем фильтры только если параметры не пустые
    filters = Q()
    if name_f:
        filters &= Q(name__icontains=name_f)
    if brand_f:
        filters &= Q(brand__icontains=brand_f)
    if loc_f:
        filters &= Q(location__icontains=loc_f)
    
    queryset = Item.objects.filter(filters)

    by_brand = list(queryset.values('brand').annotate(value=Count('id')).order_by('-value'))
    by_location = list(queryset.values('location').annotate(value=Count('id')).order_by('-value'))
    by_status = list(queryset.values('status').annotate(value=Count('id')).order_by('-value'))
    
    # Для графиков заменяем пустые значения
    for item in by_brand:
        item['brand'] = item['brand'] or 'Не указан'
    for item in by_location:
        item['location'] = item['location'] or 'Не указана'

    # Детализация
    details = ItemSerializer(queryset.order_by('-id'), many=True).data

    return Response({
        "by_brand": by_brand,
        "by_location": by_location,
        "by_status": by_status,
        "details": details
    })


@api_view(['GET'])
@permission_classes([AllowAny])
def hello(request):
    """Health check для Kubernetes"""
    return Response({"status": "ok"})


# --- СЕРВИС ---

@extend_schema(request=None, responses=ItemSerializer)
@api_view(['POST'])
def send_to_service(request, item_id):
    item = ItemServiceService.send_to_service(
        item_id=item_id,
        reason=request.data.get("reason", ""),
        user=request.user
    )
    return Response(ItemSerializer(item).data)


@extend_schema(request=None, responses=ItemSerializer)
@api_view(['POST'])
def return_from_service(request, item_id):
    from django.shortcuts import get_object_or_404
    
    item = get_object_or_404(Item, id=item_id)
    comment = request.data.get('comment', '')

    # Меняем статус на "Доступно"
    item = ItemWorkflowService.change_status(
        item_id=item_id,
        new_status=ItemStatus.AVAILABLE,
        action=f"Возвращено из сервиса. Комментарий: {comment}",
        user=request.user
    )

    return Response(ItemSerializer(item).data)


@extend_schema(request=None, responses=ItemSerializer)
@api_view(['POST'])
def confirm_repair(request, item_id):
    from django.shortcuts import get_object_or_404
    
    item = get_object_or_404(Item, id=item_id)
    
    # Получаем данные из запроса (согласно ТЗ)
    invoice_number = request.data.get('invoice_number', 'Не указан')
    service_location = request.data.get('location', 'Не указана')
    
    # Меняем статус на "В ремонте"
    item = ItemWorkflowService.change_status(
        item_id=item_id,
        new_status=ItemStatus.IN_REPAIR,
        action=f"Ремонт ТМЦ согласован — № счета {invoice_number}. Локация: {service_location}",
        user=request.user,
        location_name=service_location if service_location and service_location != 'Не указана' else None
    )

    return Response(ItemSerializer(item).data)


@extend_schema(request=None, responses=ItemSerializer)
@api_view(['POST'])
def confirm_item(request, item_id):
    """
    Подтвердить ТМЦ (статус confirm -> available).
    Используется для приёмки ТМЦ от поставщика или после передачи.
    """
    from django.shortcuts import get_object_or_404
    
    item = get_object_or_404(Item, id=item_id)
    comment = request.data.get('comment', '')
    
    # Формируем текст действия
    action_text = "ТМЦ подтверждено и принято на склад"
    if comment:
        action_text += f". Комментарий: {comment}"
    
    # Меняем статус на "Доступно"
    item = ItemWorkflowService.change_status(
        item_id=item_id,
        new_status=ItemStatus.AVAILABLE,
        action=action_text,
        user=request.user,
        comment=comment
    )

    return Response(ItemSerializer(item).data)


# --- БЛОКИРОВКА ТМЦ ---

@extend_schema(request=None, responses={'status': str})
@api_view(['POST'])
def lock_item(request, item_id):
    """
    Заблокировать ТМЦ для редактирования.
    Делегирует бизнес-логику ItemLockService.
    """
    item = ItemLockService.lock_item(item_id, request.user)
    return Response({'status': 'locked', 'locked_by': item.locked_by.username})


@extend_schema(request=None, responses={'status': str})
@api_view(['POST'])
def unlock_item(request, item_id):
    """
    Разблокировать ТМЦ.
    Делегирует бизнес-логику ItemLockService.
    """
    ItemLockService.unlock_item(item_id, request.user)
    return Response({'status': 'unlocked'})


# --- ПОДТВЕРЖДЕНИЕ ТМЦ ---

class ConfirmTMCAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        """
        Подтвердить или отклонить ТМЦ.
        Транзакция и блокировка — внутри ConfirmTMCService.process().
        """
        serializer = ConfirmTMCSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        ConfirmTMCService.process(
            item_id=pk,
            action=serializer.validated_data["action"],
            user=request.user
        )

        return Response({"success": True})

