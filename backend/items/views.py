from drf_spectacular.utils import extend_schema
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from rest_framework.views import APIView

from .models import Item, Location, Brigade
from .serializers import ItemSerializer, LocationSerializer, StatusCounterSerializer, BrigadeSerializer, ConfirmTMCSerializer
from .services import ItemLockService, ConfirmTMCService, HistoryService
from .services.commands import SendToServiceCommand, UpdateItemCommand, ReturnFromServiceCommand, ConfirmItemCommand
from .services.queries import GetItemQuery, ListItemsQuery, GetStatusCountersQuery, GetAnalyticsQuery
from .permissions import IsStorekeeper


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
        queryset = ListItemsQuery.all(search_query)
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
        # Command: изменяем состояние, получаем ID
        item_id = UpdateItemCommand.execute(item_id, request.data, request.user)
        # Query: получаем обновлённый объект для сериализации
        item = GetItemQuery.by_id(item_id)
        return Response(ItemSerializer(item).data)
            
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
    return Response(GetStatusCountersQuery.summary())


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
    """Аналитика через Query слой"""
    name_f = request.GET.get('name', '')
    brand_f = request.GET.get('brand', '')
    loc_f = request.GET.get('location', '')

    result = GetAnalyticsQuery.filtered(
        name=name_f,
        brand=brand_f,
        location=loc_f
    )

    result["details"] = ItemSerializer(result["details"], many=True).data

    return Response(result)


@api_view(['GET'])
@permission_classes([AllowAny])
def hello(request):
    """Health check для Kubernetes"""
    return Response({"status": "ok"})


# --- СЕРВИС ---

@extend_schema(request=None, responses=ItemSerializer)
@api_view(['POST'])
def send_to_service(request, item_id):
    # Command: изменяем состояние, получаем ID
    item_id = SendToServiceCommand.execute(
        item_id=item_id,
        reason=request.data.get("reason", ""),
        user=request.user
    )
    # Query: получаем обновлённый объект для сериализации
    item = GetItemQuery.by_id(item_id)
    return Response(ItemSerializer(item).data)


@extend_schema(request=None, responses=ItemSerializer)
@api_view(['POST'])
def return_from_service(request, item_id):
    # Command: изменяем состояние, получаем ID
    item_id = ReturnFromServiceCommand.execute(
        item_id=item_id,
        action="return",
        user=request.user
    )
    # Query: получаем обновлённый объект для сериализации
    item = GetItemQuery.by_id(item_id)
    return Response(ItemSerializer(item).data)


@extend_schema(request=None, responses=ItemSerializer)
@api_view(['POST'])
def confirm_repair(request, item_id):
    """
    Подтверждение начала ремонта (confirm_repair → in_repair).
    """
    # Command: подтверждаем ремонт, получаем ID
    item_id = ReturnFromServiceCommand.execute(
        item_id=item_id,
        action="confirm_repair",
        user=request.user
    )
    # Query: получаем обновлённый объект для сериализации
    item = GetItemQuery.by_id(item_id)
    return Response(ItemSerializer(item).data)


@extend_schema(request=None, responses=ItemSerializer)
@api_view(['POST'])
@permission_classes([IsStorekeeper])
def confirm_item(request, item_id):
    """
    Подтвердить ТМЦ (статус confirm -> available).
    Используется для приёмки ТМЦ от поставщика или после передачи.
    
    Permission: только кладовщик или администратор может подтверждать ТМЦ.
    """
    # Command: подтверждаем, получаем ID
    comment = request.data.get('comment', '')
    item_id = ConfirmItemCommand.execute(
        item_id=item_id,
        comment=comment,
        user=request.user
    )
    # Query: получаем обновлённый объект для сериализации
    item = GetItemQuery.by_id(item_id)
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
    """
    Подтверждение или отклонение ТМЦ кладовщиком.
    
    Permission: только кладовщик или администратор может подтверждать ТМЦ.
    """
    permission_classes = [IsStorekeeper]

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

