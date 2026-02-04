from django.db.models import Count, Q
from drf_spectacular.utils import extend_schema
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status

from .models import Item, Location
from .serializers import ItemSerializer, LocationSerializer, StatusCounterSerializer


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
    methods=['PUT'],
    description="Обновить ТМЦ",
    request=ItemSerializer,
    responses={200: ItemSerializer}
)
@extend_schema(methods=['DELETE'], description="Удалить ТМЦ")
@api_view(['PUT', 'DELETE'])
def item_detail(request, item_id):
    """PUT: обновить, DELETE: удалить"""
    try:
        item = Item.objects.get(id=item_id)
    except Item.DoesNotExist:
        return Response({"error": "Not found"}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'PUT':
        # partial=True позволяет обновлять только присланные поля
        serializer = ItemSerializer(item, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
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

@extend_schema(
    description="Аналитика: группировка по брендам, локациям и статусам",
    responses={200: dict} # Можно детализировать при необходимости
)
@api_view(['GET'])
def get_analytics(request):
    """Аналитика через Django ORM"""
    name_f = request.GET.get('name', '')
    brand_f = request.GET.get('brand', '')
    loc_f = request.GET.get('location', '')

    queryset = Item.objects.filter(
        Q(name__icontains=name_f),
        Q(brand__icontains=brand_f),
        Q(location__icontains=loc_f)
    )

    by_brand = list(queryset.values('brand').annotate(value=Count('id')).order_by('-value'))
    by_location = list(queryset.values('location').annotate(value=Count('id')).order_by('-value'))
    by_status = list(queryset.values('status').annotate(value=Count('id')).order_by('-value'))
    
    # Для графиков заменяем пустые значения
    for item in by_brand: item['brand'] = item['brand'] or 'Не указан'
    for item in by_location: item['location'] = item['location'] or 'Не указана'

    # Детализация (используем существующий сериализатор)
    details = ItemSerializer(queryset.order_by('-id'), many=True).data

    return Response({
        "by_brand": by_brand,
        "by_location": by_location,
        "by_status": by_status,
        "details": details
    })

@api_view(['GET'])
def hello(request):
    """Health check"""
    return Response({"status": "ok"})

