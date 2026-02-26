from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth import authenticate
from django.utils import timezone
from datetime import timedelta
from django.contrib.auth import get_user_model
from django.db.models import Q

from .models_session import UserSession


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_list(request):
    """
    Возвращает список пользователей с поиском и фильтрацией.
    """
    User = get_user_model()
    
    # Проверяем, что пользователь - админ
    if not request.user.is_admin():
        return Response(
            {'error': 'Доступ запрещён'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    # Параметры запроса
    search = request.query_params.get('search', '')
    search_field = request.query_params.get('search_field', '')  # Поле для поиска (username, email, first_name, last_name)
    role = request.query_params.get('role', '')
    page = int(request.query_params.get('page', 1))
    page_size = int(request.query_params.get('page_size', 10))
    
    # Базовый queryset
    queryset = User.objects.all()
    
    # Поиск - по конкретному полю или по всем полям
    if search:
        if search_field == 'full_name':
            # Поиск по ФИО (имя + фамилия)
            queryset = queryset.filter(
                Q(first_name__icontains=search.lower()) |
                Q(last_name__icontains=search.lower())
            )
        elif search_field in ['username', 'email', 'first_name', 'last_name']:
            # Поиск по конкретному полю
            queryset = queryset.filter(
                **{f'{search_field}__icontains': search}
            )
        else:
            # Поиск по всем полям (общий поиск)
            queryset = queryset.filter(
                Q(username__icontains=search.lower()) |
                Q(email__icontains=search.lower()) |
                Q(first_name__icontains=search.lower()) |
                Q(last_name__icontains=search.lower())
            )
    
    # Фильтр по роли (может быть несколько ролей через запятую)
    if role:
        roles_list = [r.strip() for r in role.split(',') if r.strip()]
        if roles_list:
            queryset = queryset.filter(role__in=roles_list)
    
    # Сортировка по username
    queryset = queryset.order_by('username')
    
    # Пагинация
    total_count = queryset.count()
    start = (page - 1) * page_size
    end = start + page_size
    users_data = queryset[start:end]
    
    # Формируем ответ
    users = []
    for user in users_data:
        users.append({
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'role': user.role,
            'is_active': user.is_active,
            'date_joined': user.date_joined.isoformat() if user.date_joined else None,
            'last_login': user.last_login.isoformat() if user.last_login else None,
        })
    
    return Response({
        'users': users,
        'total_count': total_count,
        'page': page,
        'page_size': page_size,
        'total_pages': (total_count + page_size - 1) // page_size if total_count > 0 else 0,
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_current_user(request):
    """Возвращает расширенную информацию о текущем пользователе"""
    user = request.user
    
    # ДЛЯ ОТЛАДКИ: Логируем информацию о пользователе
    import logging
    logger = logging.getLogger(__name__)
    logger.error(f"[DEBUG /me] request.user = {request.user}")
    logger.error(f"[DEBUG /me] request.user.id = {request.user.id}")
    logger.error(f"[DEBUG /me] request.user.role = {request.user.role}")
    logger.error(f"[DEBUG /me] type(request.user.role) = {type(request.user.role)}")
    logger.error(f"[DEBUG /me] request.user.is_admin() = {request.user.is_admin()}")
    
    # Получаем последнюю активность
    last_activity = user.last_login
    
    # Получаем информацию о сессиях
    active_sessions = UserSession.objects.filter(
        user=user,
        is_active=True
    )
    
    return Response({
        'id': user.id,
        'username': user.username,
        'email': user.email,
        'role': getattr(user, 'role', 'user'),
        'first_name': user.first_name,
        'last_name': user.last_name,
        'last_activity': last_activity.isoformat() if last_activity else None,
        'date_joined': user.date_joined.isoformat() if user.date_joined else None,
        'active_sessions_count': active_sessions.count(),
    })


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
def change_password(request):
    """
    Смена пароля пользователя.
    Требует ввод текущего пароля для подтверждения.
    """
    current_password = request.data.get('current_password')
    new_password = request.data.get('new_password')
    confirm_password = request.data.get('confirm_password')
    
    # Валидация полей
    if not current_password or not new_password or not confirm_password:
        return Response(
            {'error': 'Все поля обязательны для заполнения'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    if new_password != confirm_password:
        return Response(
            {'error': 'Новый пароль и подтверждение не совпадают'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    if len(new_password) < 8:
        return Response(
            {'error': 'Пароль должен содержать минимум 8 символов'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Проверка текущего пароля
    user = authenticate(
        username=request.user.username,
        password=current_password
    )
    
    if user is None:
        return Response(
            {'error': 'Неверный текущий пароль'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Установка нового пароля
    request.user.set_password(new_password)
    request.user.save()
    
    return Response({'success': True, 'message': 'Пароль успешно изменён'})


@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def update_profile(request):
    """
    Обновление профиля пользователя (ФИО, email).
    """
    first_name = request.data.get('first_name', '').strip()
    last_name = request.data.get('last_name', '').strip()
    email = request.data.get('email', '').strip()
    
    user = request.user
    
    if first_name:
        user.first_name = first_name
    if last_name:
        user.last_name = last_name
    if email:
        # Проверка уникальности email
        from django.contrib.auth import get_user_model
        User = get_user_model()
        if User.objects.exclude(pk=user.pk).filter(email=email).exists():
            return Response(
                {'error': 'Этот email уже используется другим пользователем'},
                status=status.HTTP_400_BAD_REQUEST
            )
        user.email = email
    
    user.save()
    
    return Response({
        'success': True,
        'message': 'Профиль обновлён',
        'user': {
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'first_name': user.first_name,
            'last_name': user.last_name,
        }
    })


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

