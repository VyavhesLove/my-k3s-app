"""
Кастомный context processor для передачи данных о maintenance mode в шаблоны.
"""
from django.core.cache import cache


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
            maintenance = MaintenanceMode.objects.first()
            if maintenance:
                info = {
                    'maintenance_mode': True,
                    'planned_end_time': maintenance.planned_end_time,
                }
            else:
                info = {
                    'maintenance_mode': True,
                    'planned_end_time': None,
                }
        else:
            info = {
                'maintenance_mode': False,
                'planned_end_time': None,
            }
    except Exception:
        info = {
            'maintenance_mode': False,
            'planned_end_time': None,
        }
    
    # Кэшируем на 30 секунд
    cache.set('maintenance_context', info, 30)
    
    return info

