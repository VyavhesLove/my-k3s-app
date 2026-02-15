# View для получения истории ТМЦ с пагинацией
from drf_spectacular.utils import extend_schema
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework import status

from ..models import Item, ItemHistory
from ..serializers import ItemHistorySerializer
from ..services.queries import GetItemHistoryQuery
from ..services import DomainNotFoundError
from ..utils import api_response


@extend_schema(
    methods=['GET'],
    description="Получить историю ТМЦ с пагинацией",
    responses={200: ItemHistorySerializer(many=True)}
)
@api_view(['GET'])
@permission_classes([AllowAny])
def item_history(request, item_id):
    """
    GET: Получить историю ТМЦ с пагинацией.
    
    Query params:
        - page: Номер страницы (по умолчанию 1)
        - page_size: Количество записей на странице (по умолчанию 20, макс 100)
    """
    # Проверяем существование ТМЦ
    if not Item.objects.filter(id=item_id).exists():
        raise DomainNotFoundError("ТМЦ не найдено")
    
    # Получаем параметры пагинации
    try:
        page = int(request.GET.get('page', 1))
        page_size = int(request.GET.get('page_size', 20))
    except ValueError:
        page = 1
        page_size = 20
    
    # Ограничиваем page_size
    page_size = min(page_size, 100)
    
    # Получаем общее количество записей
    total_count = ItemHistory.objects.filter(item_id=item_id).count()
    
    # Вычисляем пагинацию
    start_index = (page - 1) * page_size
    end_index = start_index + page_size
    
    # Получаем историю
    history_queryset = GetItemHistoryQuery.all(item_id)
    history_page = history_queryset[start_index:end_index]
    
    # Сериализуем
    serializer = ItemHistorySerializer(history_page, many=True)
    
    # Возвращаем с мета-информацией о пагинации
    total_pages = (total_count + page_size - 1) // page_size if total_count > 0 else 1
    
    return api_response(data={
        "history": serializer.data,
        "pagination": {
            "page": page,
            "page_size": page_size,
            "total_count": total_count,
            "total_pages": total_pages,
            "has_next": page < total_pages,
            "has_prev": page > 1
        }
    })

