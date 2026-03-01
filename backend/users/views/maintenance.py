"""
Views для управления режимом обслуживания (maintenance mode).
"""
from django.core.cache import cache
from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAdminUser
from rest_framework.response import Response

from users.models import MaintenanceMode
from users.serializers import MaintenanceModeSerializer


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
    # Используем singleton manager для гарантии работы с одной записью
    maintenance = MaintenanceMode.objects.get_instance()
    
    if request.method == 'POST':
        # Используем serializer для корректной валидации boolean
        serializer = MaintenanceModeSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        enabled = serializer.validated_data.get('enabled', False)
        planned_end_time = serializer.validated_data.get('planned_end_time')
        
        maintenance.enabled = enabled
        maintenance.planned_end_time = planned_end_time
        maintenance.save()
        
        # Очищаем кэш
        cache.delete('maintenance_context')
        cache.delete('maintenance_mode_state')
        
        response_data = {
            'enabled': maintenance.enabled,
            'planned_end_time': maintenance.planned_end_time,
            'message': 'Режим обслуживания включён' if maintenance.enabled else 'Режим обслуживания выключен'
        }
        
        return Response(
            MaintenanceModeSerializer(response_data).data,
            status=status.HTTP_200_OK
        )
    
    # GET request
    return Response(
        MaintenanceModeSerializer({
            'enabled': maintenance.enabled,
            'planned_end_time': maintenance.planned_end_time,
        }).data
    )


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
    # Используем singleton manager для гарантии работы с одной записью
    maintenance = MaintenanceMode.objects.get_instance()
    
    # Используем serializer для корректной валидации boolean
    serializer = MaintenanceModeSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    
    # Если enabled передан - используем его, иначе инвертируем
    if 'enabled' in serializer.validated_data:
        new_enabled = serializer.validated_data['enabled']
    else:
        new_enabled = not maintenance.enabled
    
    maintenance.enabled = new_enabled
    maintenance.save()
    
    # Очищаем кэш
    cache.delete('maintenance_context')
    cache.delete('maintenance_mode_state')
    
    response_data = {
        'enabled': maintenance.enabled,
        'planned_end_time': maintenance.planned_end_time,
        'message': 'Режим обслуживания включён' if maintenance.enabled else 'Режим обслуживания выключен'
    }
    
    return Response(
        MaintenanceModeSerializer(response_data).data,
        status=status.HTTP_200_OK
    )

