# CRUD ТМЦ
from drf_spectacular.utils import extend_schema
from rest_framework.decorators import api_view

from ..models import Item
from ..serializers import ItemSerializer
from ..services.queries import GetItemQuery, ListItemsQuery
from ..services.commands import UpdateItemCommand
from ..services import DomainValidationError, DomainNotFoundError
from ..utils import api_response


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
        return api_response(data={"items": serializer.data})
    
    if request.method == 'POST':
        serializer = ItemSerializer(data=request.data)
        if serializer.is_valid():
            item = serializer.save()
            return api_response(data=ItemSerializer(item).data, status_code=201)
        # ValidationError автоматически обработается через raise
        raise DomainValidationError(str(serializer.errors))


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
        raise DomainNotFoundError("ТМЦ не найдено")

    if request.method in ['PUT', 'PATCH']:
        item_id = UpdateItemCommand.execute(item_id, request.data, request.user)
        item = GetItemQuery.by_id(item_id)
        return api_response(data=ItemSerializer(item).data)
            
    if request.method == 'DELETE':
        item.delete()
        return api_response(data={"message": "ТМЦ удалено"})

