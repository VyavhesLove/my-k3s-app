# Блокировки ТМЦ
from drf_spectacular.utils import extend_schema
from rest_framework.decorators import api_view

from ..services import LockService
from ..exceptions import DomainConflictError
from ..utils import api_response


@extend_schema(request=None, responses={'status': str})
@api_view(['POST'])
def lock_item(request, item_id):
    """
    Заблокировать ТМЦ для редактирования.
    """
    item = LockService.lock(item_id, request.user)
    return api_response(
        data={'status': 'locked', 'locked_by': item.locked_by.username},
        message="ТМЦ заблокировано"
    )


@extend_schema(request=None, responses={'status': str})
@api_view(['POST'])
def unlock_item(request, item_id):
    """
    Разблокировать ТМЦ.
    """
    LockService.unlock(item_id, request.user)
    return api_response(
        data={'status': 'unlocked'},
        message="ТМЦ разблокировано"
    )

