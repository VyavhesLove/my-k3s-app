from django.db.models import Count, Q
from drf_spectacular.utils import extend_schema
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status

from .models import Item, Location, Brigade
from .serializers import ItemSerializer, LocationSerializer, StatusCounterSerializer, BrigadeSerializer


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
        # partial=True позволяет обновлять только присланные поля (важно для PATCH)
        old_status = item.status  # 1. Запоминаем старый статус
        
        serializer = ItemSerializer(item, data=request.data, partial=True)
        if serializer.is_valid():
            # 2. Сохраняем изменения (serializer.save() обновляет item)
            item = serializer.save() 
            
            # 3. Логика истории
            service_comment = request.data.get('service_comment')
            new_status = item.status  # Теперь тут уже новый статус
            
            if service_comment:
                from .models import ItemHistory
                # Формируем текст операции
                if old_status != new_status:
                    action_text = f"Смена статуса: {old_status} → {new_status}"
                else:
                    action_text = "Обновление информации"
                
                ItemHistory.objects.create(
                    item=item,
                    action=action_text,
                    comment=service_comment,
                    user=request.user.username if request.user.is_authenticated else "API"
                )
            
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
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
        "to_receive": raw_data.get('confirm', 0), 
        "to_repair": raw_data.get('confirm_repair', 0),
        "issued": raw_data.get('issued', 0) + raw_data.get('at_work', 0)
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
    from django.shortcuts import get_object_or_404
    from .models import ItemHistory
    
    item = get_object_or_404(Item, id=item_id)
    reason = request.data.get('reason', '')

    # Если предмет у бригады, сбрасываем привязку (возврат на склад)
    if item.brigade:
        item.brigade = None
    
    # Меняем статус на "Подтвердить ремонт" (confirm_repair)
    item.status = 'confirm_repair'
    item.save()

    # Создаем запись в истории
    ItemHistory.objects.create(
        item=item,
        action=f"Отправлено в сервис. Причина: {reason}. Ожидание подтверждения.",
        user=request.user.username or "Система"
    )

    return Response(ItemSerializer(item).data)


@extend_schema(request=None, responses=ItemSerializer)
@api_view(['POST'])
def return_from_service(request, item_id):
    from django.shortcuts import get_object_or_404
    from .models import ItemHistory
    
    item = get_object_or_404(Item, id=item_id)
    comment = request.data.get('comment', '')

    # Меняем статус на "Доступно" (available)
    item.status = 'available'
    item.save()

    ItemHistory.objects.create(
        item=item,
        action=f"Возвращено из сервиса. Комментарий: {comment}",
        user=request.user.username or "Система"
    )

    return Response(ItemSerializer(item).data)


@extend_schema(request=None, responses=ItemSerializer)
@api_view(['POST'])
def confirm_repair(request, item_id):
    from django.shortcuts import get_object_or_404
    from .models import ItemHistory
    
    item = get_object_or_404(Item, id=item_id)
    
    # Получаем данные из запроса (согласно ТЗ)
    invoice_number = request.data.get('invoice_number', 'Не указан')
    service_location = request.data.get('location', 'Не указана')
    
    # Меняем статус на "В ремонте"
    item.status = 'in_repair' 
    item.save()

    # Записываем историю (согласно логике из md файла)
    ItemHistory.objects.create(
        item=item,
        action=f"Ремонт ТМЦ согласован — № счета {invoice_number}. Локация: {service_location}",
        user=request.user.username if request.user.is_authenticated else "Система"
    )

    return Response(ItemSerializer(item).data)


# --- БЛОКИРОВКА ТМЦ ---

@extend_schema(request=None, responses={'status': str})
@api_view(['POST'])
def lock_item(request, item_id):
    """
    Заблокировать ТМЦ для редактирования.
    Возвращает 423 Locked, если предмет уже заблокирован другим пользователем.
    """
    from django.shortcuts import get_object_or_404
    from django.utils import timezone
    
    item = get_object_or_404(Item, id=item_id)
    
    # Проверяем, не заблокирован ли уже предмет
    if item.locked_by:
        return Response({
            'error': f'Заблокировано пользователем {item.locked_by.username}',
            'locked_by': item.locked_by.username,
            'locked_at': item.locked_at.isoformat() if item.locked_at else None
        }, status=status.HTTP_423_LOCKED)
    
    # Блокируем предмет
    item.locked_by = request.user
    item.locked_at = timezone.now()
    item.save()
    
    return Response({'status': 'locked', 'locked_by': item.locked_by.username})


@extend_schema(request=None, responses={'status': str})
@api_view(['POST'])
def unlock_item(request, item_id):
    """
    Разблокировать ТМЦ.
    Может разблокировать только тот пользователь, который заблокировал,
    или администратор.
    """
    from django.shortcuts import get_object_or_404
    
    item = get_object_or_404(Item, id=item_id)
    
    # Проверяем права на разблокировку
    if item.locked_by and item.locked_by != request.user:
        # Разрешаем разблокировку только если это админ
        if not request.user.is_superuser:
            return Response({
                'error': f'ТМЦ заблокировано пользователем {item.locked_by.username}'
            }, status=status.HTTP_403_FORBIDDEN)
    
    # Разблокируем предмет
    item.locked_by = None
    item.locked_at = None
    item.save()
    
    return Response({'status': 'unlocked'})

