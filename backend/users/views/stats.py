"""Системная статистика для админ-панели."""
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.contrib.auth import get_user_model

# Модель UserSession определена в models_session.py для избежания циклических импортов
from ..models_session import UserSession


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_system_stats(request):
    """
    Возвращает статистику системы:
    - количество активных пользователей
    - количество активных сессий
    """
    # Проверяем, что пользователь - админ
    if not request.user.is_staff:
        return Response(
            {'error': 'Доступ запрещён'},
            status=403
        )
    
    User = get_user_model()
    
    # Количество активных пользователей (active=True)
    active_users_count = User.objects.filter(active=True).count()
    
    # Количество активных сессий
    active_sessions_count = UserSession.objects.filter(is_active=True).count()
    
    return Response({
        'active_users_count': active_users_count,
        'active_sessions_count': active_sessions_count,
    })

