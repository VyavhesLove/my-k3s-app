# Справочники, аналитика и системные ручки
from drf_spectacular.utils import extend_schema
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.views import APIView
from rest_framework.response import Response

from ..models import Location, Brigade, ErrorLog
from ..serializers import LocationSerializer, BrigadeSerializer, StatusCounterSerializer, ErrorLogSerializer
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


@extend_schema(
    methods=['GET'],
    description="Конфигурация приложения",
    responses={200: dict}
)
@api_view(['GET'])
@permission_classes([AllowAny])
def get_config(request):
    """Конфигурация приложения для клиента"""
    from django.conf import settings
    return api_response(data={
        "debug": settings.DEBUG,
        "version": "1.2.4",
        "environment": "staging" if settings.DEBUG else "production",
        "features": {
            "enable_scraps": True,
            "enable_reports": False
        }
    })


@extend_schema(
    methods=['POST'],
    description="Логирование ошибок фронтенда",
    request={
        "application/json": {
            "example": {
                "message": "TypeError: Cannot read property 'foo' of undefined",
                "stack_trace": "Error at Component.render...",
                "url": "http://localhost/items/1",
                "user_agent": "Mozilla/5.0..."
            }
        }
    },
    responses={201: dict}
)
@api_view(['POST'])
def log_error(request):
    """
    Сохранение лога ошибки с фронтенда.
    Анонимный endpoint - не требует аутентификации.
    """
    from .models import ErrorLog
    from .serializers import ErrorLogSerializer

    # Получаем данные из запроса
    message = request.data.get('message', '')
    stack_trace = request.data.get('stack_trace', '')
    url = request.data.get('url', '')
    user_agent = request.data.get('user_agent', '')

    # Пытаемся получить пользователя из токена (если есть)
    user = None
    if request.user and request.user.is_authenticated:
        user = request.user

    # Создаём запись
    error_log = ErrorLog.objects.create(
        user=user,
        message=message,
        stack_trace=stack_trace,
        url=url,
        user_agent=user_agent
    )

    serializer = ErrorLogSerializer(error_log)
    return api_response(data=serializer.data, status=201)


class ErrorLogView(APIView):
    """
    APIView для логирования ошибок фронтенда.
    Разрешаем отправлять логи даже если что-то сломалось в авторизации.
    """
    permission_classes = []
    
    def post(self, request):
        ErrorLog.objects.create(
            user=request.user if request.user.is_authenticated else None,
            url=request.data.get('url'),
            message=request.data.get('message'),
            stack_trace=request.data.get('stack_trace'),
            user_agent=request.META.get('HTTP_USER_AGENT', 'unknown')
        )
        return Response({"status": "ok"})

