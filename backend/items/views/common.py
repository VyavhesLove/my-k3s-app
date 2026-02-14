# Справочники, аналитика и системные ручки
from drf_spectacular.utils import extend_schema
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny

from ..models import Location, Brigade
from ..serializers import LocationSerializer, BrigadeSerializer, StatusCounterSerializer
from ..services.queries import GetStatusCountersQuery, GetAnalyticsQuery
from ..exceptions import DomainValidationError
from ..utils import api_response


@extend_schema(
    methods=['GET'],
    description="Счетчики статусов для уведомлений",
    responses={200: StatusCounterSerializer}
)
@api_view(['GET'])
def get_status_counters(request):
    """Получить счетчики статусов для виджета уведомлений"""
    return api_response(data=GetStatusCountersQuery.summary())


@extend_schema(responses={200: LocationSerializer(many=True)})
@api_view(['GET'])
def location_list(request):
    """Список локаций для выпадающих списков"""
    locations = Location.objects.all().order_by('name')
    serializer = LocationSerializer(locations, many=True)
    return api_response(data={"locations": serializer.data})


@extend_schema(methods=['GET'], responses=BrigadeSerializer(many=True))
@extend_schema(methods=['POST'], request=BrigadeSerializer, responses=BrigadeSerializer)
@api_view(['GET', 'POST'])
def brigade_list(request):
    if request.method == 'GET':
        brigades = Brigade.objects.all().order_by('name')
        return api_response(data={"brigades": BrigadeSerializer(brigades, many=True).data})
    
    if request.method == 'POST':
        serializer = BrigadeSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return api_response(data=serializer.data)
        raise DomainValidationError(str(serializer.errors))


@extend_schema(
    description="Аналитика: группировка по брендам, локациям и статусам",
    responses={200: dict}
)
@api_view(['GET'])
def get_analytics(request):
    """Аналитика через Query слой"""
    from ..serializers import ItemSerializer
    name_f = request.GET.get('name', '')
    brand_f = request.GET.get('brand', '')
    loc_f = request.GET.get('location', '')

    result = GetAnalyticsQuery.filtered(
        name=name_f,
        brand=brand_f,
        location=loc_f
    )

    result["details"] = ItemSerializer(result["details"], many=True).data

    return api_response(data=result)


@api_view(['GET'])
@permission_classes([AllowAny])
def hello(request):
    """Health check для Kubernetes"""
    return api_response(data={"status": "ok"})

