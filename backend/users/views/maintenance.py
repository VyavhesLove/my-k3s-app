"""
Views для управления режимом обслуживания (maintenance mode).
"""
from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.cache import cache
from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAdminUser
from rest_framework.response import Response

from users.models import MaintenanceMode
from users.serializers import MaintenanceModeSerializer, MaintenanceModeSettingsSerializer
from users.middleware import clear_maintenance_whitelist_cache

User = get_user_model()


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


@api_view(['GET', 'PATCH'])
@permission_classes([IsAdminUser])
def get_maintenance_settings(request):
    """
    GET: Получить все настройки режима обслуживания.
    PATCH: Обновить настройки режима обслуживания.
    
    GET response:
    {
        "enabled": true,
        "planned_end_time": "2024-12-25T15:00:00Z",
        "ips": ["192.168.1.1"],
        "urls": ["/api/health"],
        "admin_users": ["admin"]
    }
    
    PATCH payload:
    {
        "enabled": true,
        "planned_end_time": "2024-12-25T15:00:00Z",
        "ips": ["192.168.1.1"],
        "urls": ["/api/health"]
    }
    """
    # Используем singleton manager для гарантии работы с одной записью
    maintenance = MaintenanceMode.objects.get_instance()
    
    # Получаем список пользователей с ролью admin
    admin_users = User.objects.filter(role='admin', is_active=True).values_list('username', flat=True)
    
    if request.method == 'GET':
        # Формируем данные из модели и settings
        data = {
            'enabled': maintenance.enabled,
            'planned_end_time': maintenance.planned_end_time,
            'ips': maintenance.allowed_ips or [],
            'urls': maintenance.allowed_urls or [],
            'admin_users': list(admin_users),
        }
        
        serializer = MaintenanceModeSettingsSerializer(data)
        return Response(serializer.data)
    
    # PATCH request
    serializer = MaintenanceModeSettingsSerializer(data=request.data, partial=True)
    serializer.is_valid(raise_exception=True)
    
    # Обновляем поля модели
    validated = serializer.validated_data
    
    if 'enabled' in validated:
        maintenance.enabled = validated['enabled']
    if 'planned_end_time' in validated:
        maintenance.planned_end_time = validated['planned_end_time']
    if 'ips' in validated:
        maintenance.allowed_ips = validated['ips']
    if 'urls' in validated:
        maintenance.allowed_urls = validated['urls']
    
    maintenance.save()
    
    # Очищаем кэш
    cache.delete('maintenance_context')
    cache.delete('maintenance_mode_state')
    clear_maintenance_whitelist_cache()
    
    # Возвращаем обновлённые данные
    data = {
        'enabled': maintenance.enabled,
        'planned_end_time': maintenance.planned_end_time,
        'ips': maintenance.allowed_ips or [],
        'urls': maintenance.allowed_urls or [],
        'admin_users': list(admin_users),
    }
    
    return Response(MaintenanceModeSettingsSerializer(data).data)

