"""История действий и сессии пользователя."""
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

# Модель UserSession определена в models_session.py для избежания циклических импортов
from ..models_session import UserSession


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_history(request):
    """Возвращает историю последних операций пользователя (последние 10 действий)"""
    from items.models import ItemHistory
    
    # Получаем историю для текущего пользователя
    history = ItemHistory.objects.filter(
        user=request.user
    ).select_related('item').order_by('-timestamp')[:10]
    
    history_data = []
    for item in history:
        history_data.append({
            'id': item.id,
            'item_id': item.item.id if item.item else None,
            'item_name': item.item.name if item.item else 'Удалённый ТМЦ',
            'action': item.action,
            'action_type': item.action_type,
            'timestamp': item.timestamp.isoformat(),
            'comment': item.comment,
        })
    
    return Response(history_data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_active_sessions(request):
    """Возвращает список активных сессий пользователя"""
    sessions = UserSession.objects.filter(
        user=request.user,
        is_active=True
    ).order_by('-last_activity')
    
    # Получаем ID текущей сессии из заголовка или определяем по другому
    current_token_id = request.headers.get('X-Session-ID', None)
    
    sessions_data = []
    for session in sessions:
        sessions_data.append({
            'id': session.id,
            'token_id': session.token_id[:8] + '...' if session.token_id else None,
            'user_agent': session.user_agent or 'Неизвестное устройство',
            'ip_address': session.ip_address,
            'created_at': session.created_at.isoformat(),
            'last_activity': session.last_activity.isoformat(),
            'description': session.description,
            'is_current': session.token_id == current_token_id,
        })
    
    return Response(sessions_data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def terminate_session(request):
    """Завершает указанную сессию пользователя"""
    session_id = request.data.get('session_id')
    
    if not session_id:
        return Response(
            {'error': 'Не указан ID сессии'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        session = UserSession.objects.get(
            id=session_id,
            user=request.user,
            is_active=True
        )
        
        session.is_active = False
        session.save()
        
        return Response({'success': True, 'message': 'Сессия завершена'})
    
    except UserSession.DoesNotExist:
        return Response(
            {'error': 'Сессия не найдена или уже завершена'},
            status=status.HTTP_404_NOT_FOUND
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_session(request):
    """
    Создание записи о сессии пользователя.
    Вызывается при успешной аутентификации.
    """
    token_id = request.data.get('token_id')
    user_agent = request.data.get('user_agent')
    ip_address = request.data.get('ip_address')
    description = request.data.get('description', 'Основной браузер')
    
    if not token_id:
        return Response(
            {'error': 'Token ID обязателен'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Проверяем, не существует ли уже такая сессия
    session, created = UserSession.objects.update_or_create(
        user=request.user,
        token_id=token_id,
        defaults={
            'user_agent': user_agent,
            'ip_address': ip_address,
            'description': description,
            'is_active': True,
        }
    )
    
    return Response({
        'success': True,
        'session_id': session.id,
    })

