"""
Views для управления режимом обслуживания (maintenance mode).
"""
from django.utils import timezone
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAdminUser
from rest_framework.response import Response
from rest_framework import status

from users.models import MaintenanceMode


@api_view(['GET', 'POST'])
@permission_classes([IsAdminUser])
def get_maintenance_status(request):
    """
    GET: Получить текущий статус режима обслуживания.
    POST: Включить/выключить режим обслуживания.
    
    POST payload:
    {
        "enabled": true,
        "planned_end_time": "2024-12-25T15:00:00Z"  # опционально
    }
    """
    maintenance = MaintenanceMode.objects.first()
    
    if request.method == 'POST':
        enabled = request.data.get('enabled', False)
        planned_end_time = request.data.get('planned_end_time')
        
        if not maintenance:
            maintenance = MaintenanceMode.objects.create(
                enabled=False,
                planned_end_time=None
            )
        
        maintenance.enabled = bool(enabled)
        
        if planned_end_time:
            from django.utils.dateparse import parse_datetime
            maintenance.planned_end_time = parse_datetime(planned_end_time)
        else:
            maintenance.planned_end_time = None
        
        maintenance.save()
        
        # Очищаем кэш
        from django.core.cache import cache
        cache.delete('maintenance_context')
        cache.delete('maintenance_mode_state')
        
        return Response({
            'enabled': maintenance.enabled,
            'planned_end_time': maintenance.planned_end_time,
            'message': 'Режим обслуживания включён' if maintenance.enabled else 'Режим обслуживания выключен'
        })
    
    # GET request
    if maintenance:
        return Response({
            'enabled': maintenance.enabled,
            'planned_end_time': maintenance.planned_end_time,
        })
    
    return Response({
        'enabled': False,
        'planned_end_time': None,
    })


@api_view(['POST'])
@permission_classes([IsAdminUser])
def toggle_maintenance(request):
    """
    Включить/выключить режим обслуживания (упрощённый endpoint).
    
    POST payload:
    {
        "enabled": true  # опционально, по умолчанию инвертирует текущее состояние
    }
    """
    maintenance = MaintenanceMode.objects.first()
    
    if not maintenance:
        maintenance = MaintenanceMode.objects.create(
            enabled=False,
            planned_end_time=None
        )
    
    # Если enabled передан - используем его, иначе инвертируем
    if 'enabled' in request.data:
        new_enabled = bool(request.data.get('enabled'))
    else:
        new_enabled = not maintenance.enabled
    
    maintenance.enabled = new_enabled
    maintenance.save()
    
    # Очищаем кэш
    from django.core.cache import cache
    cache.delete('maintenance_context')
    cache.delete('maintenance_mode_state')
    
    return Response({
        'enabled': maintenance.enabled,
        'planned_end_time': maintenance.planned_end_time,
        'message': 'Режим обслуживания включён' if maintenance.enabled else 'Режим обслуживания выключен'
    })

