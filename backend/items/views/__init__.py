# Импортируем ВСЁ для обратной совместимости
# views.py удалён — все вьюхи теперь здесь

from .items import item_list, item_detail
from .services import (
    send_to_service, return_from_service, confirm_repair,
    confirm_item, write_off_item, cancel_write_off_item
)
from .locks import lock_item, unlock_item
from .common import (
    location_list, brigade_list, get_analytics,
    get_status_counters, hello
)
from .confirm_tmc import ConfirmTMCAPIView

# Alias для обратной совместимости с urls.py
# items/urls.py использует views.item_list и т.д.
item_list = item_list
item_detail = item_detail
send_to_service = send_to_service
return_from_service = return_from_service
confirm_repair = confirm_repair
confirm_item = confirm_item
write_off_item = write_off_item
cancel_write_off_item = cancel_write_off_item
lock_item = lock_item
unlock_item = unlock_item
location_list = location_list
brigade_list = brigade_list
get_analytics = get_analytics
get_status_counters = get_status_counters
hello = hello

__all__ = [
    'item_list', 'item_detail',
    'send_to_service', 'return_from_service', 'confirm_repair',
    'confirm_item', 'write_off_item', 'cancel_write_off_item',
    'lock_item', 'unlock_item',
    'location_list', 'brigade_list', 'get_analytics', 'get_status_counters', 'hello',
    'ConfirmTMCAPIView',
]

