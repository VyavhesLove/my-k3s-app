"""
Кастомный context processor для передачи данных о maintenance mode в шаблоны.
"""
import logging
from django.core.cache import cache

logger = logging.getLogger(__name__)


def maintenance_mode_context(request):
    """
    Добавляет информацию о режиме обслуживания в контекст шаблонов.
    """
    # Пробуем получить из кэша
    cached_info = cache.get('maintenance_context')
    if cached_info is not None:
        return cached_info
    
    try:
        from users.models import MaintenanceMode
        from maintenance_mode.core import get_maintenance_mode
        
        if get_maintenance_mode():
            # Используем singleton manager для гарантии работы с одной записью
            maintenance = MaintenanceMode.objects.get_instance()
            info = {
                'maintenance_mode': maintenance.enabled,
                'planned_end_time': maintenance.planned_end_time,
            }
        else:
            info = {
                'maintenance_mode': False,
                'planned_end_time': None,
            }
    except Exception as e:
        logger.exception("Error getting maintenance mode context: %s", e)
        info = {
            'maintenance_mode': False,
            'planned_end_time': None,
        }
    
    # Кэшируем на 30 секунд
    cache.set('maintenance_context', info, 30)
    
    return info

