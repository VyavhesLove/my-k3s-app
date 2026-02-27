from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status, serializers
from django.contrib.auth import authenticate
from django.utils import timezone
from datetime import timedelta
from django.contrib.auth import get_user_model
from django.db.models import Q
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from .serializers import CreateUserSerializer, UserResponseSerializer
from .models_session import UserSession


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """
    Кастомный сериализатор для получения токена.
    Проверяет, что пользователь активен (active).
    Возвращает корректное сообщение "Пользователь заблокирован" вместо стандартного
    "Invalid username or password" если пользователь неактивен.
    """
    def validate(self, attrs):
        User = get_user_model()
        username = attrs.get('username')
        
        # Если есть username - проверяем пользователя
        if username:
            try:
                user = User.objects.get(username=username)
                # Проверяем active перед аутентификацией
                if not user.active:
                    raise serializers.ValidationError({
                        'non_field_errors': ['Пользователь заблокирован']
                    })
            except User.DoesNotExist:
                # Если пользователя не существует - пропускаем
                pass
        
        # Вызываем стандартную валидацию (которая сгенерирует токен)
        return super().validate(attrs)


class CustomTokenObtainPairView(TokenObtainPairView):
    """
    Кастомное представление для получения токена.
    Проверяет active перед выдачей токена.
    """
    serializer_class = CustomTokenObtainPairSerializer


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_user(request):
    """
    Создание нового пользователя.
    Доступно только для администраторов.
    """
    # Проверяем, что пользователь - админ
    if not request.user.is_admin():
        return Response(
            {'success': False, 'error': 'Доступ запрещён. Только администраторы могут создавать пользователей.'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    serializer = CreateUserSerializer(data=request.data)
    
    if serializer.is_valid():
        user = serializer.save()
        
        return Response({
            'success': True,
            'message': 'Пользователь успешно создан',
            'data': UserResponseSerializer(user).data
        }, status=status.HTTP_201_CREATED)
    
    return Response({
        'success': False,
        'error': 'Ошибка валидации',
        'details': serializer.errors
    }, status=status.HTTP_400_BAD_REQUEST)


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
    
    # Фильтр по роли (может быть несколько ролей через запятую)
    if role:
        roles_list = [r.strip() for r in role.split(',') if r.strip()]
        if roles_list:
            queryset = queryset.filter(role__in=roles_list)
    
    # Сортируем и получаем все записи
    users_pool = list(queryset.order_by('username'))
    
    # Поиск по Unicode выполняем в Python через casefold,
    # чтобы не зависеть от ограничений колляции/LIKE в SQLite для кириллицы.
    if search:
        search_casefold = search.casefold()

        def field_matches(value):
            return search_casefold in (value or '').casefold()

        if search_field == 'full_name':
            users_pool = [
                u for u in users_pool
                if field_matches(u.first_name) or field_matches(u.last_name)
            ]
        elif search_field in ['username', 'email', 'first_name', 'last_name']:
            users_pool = [
                u for u in users_pool
                if field_matches(getattr(u, search_field, ''))
            ]
        else:
            users_pool = [
                u for u in users_pool
                if field_matches(u.username)
                or field_matches(u.email)
                or field_matches(u.first_name)
                or field_matches(u.last_name)
            ]
    
    # Пагинация
    total_count = len(users_pool)
    start = (page - 1) * page_size
    end = start + page_size
    users_data = users_pool[start:end]
    
    # Формируем ответ
    users = []
    for user in users_data:
        users.append({
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'surname': user.surname,
            'role': user.role,
            'active': user.active,
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
        'surname': user.surname,
        'active': user.active,
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
    surname = request.data.get('surname', '').strip()
    email = request.data.get('email', '').strip()
    
    user = request.user
    
    if first_name:
        user.first_name = first_name
    if last_name:
        user.last_name = last_name
    if surname:
        user.surname = surname
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
            'surname': user.surname,
        }
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def toggle_user_block(request, user_id):
    """
    Блокировка/разблокировка пользователя.
    Проверка: нельзя заблокировать последнего администратора.
    """
    User = get_user_model()
    
    # Проверяем, что пользователь - админ
    if not request.user.is_admin():
        return Response(
            {'success': False, 'error': 'Доступ запрещён'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    # Получаем пользователя для блокировки
    try:
        target_user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return Response(
            {'success': False, 'error': 'Пользователь не найден'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Нельзя заблокировать самого себя
    if target_user.id == request.user.id:
        return Response(
            {'success': False, 'error': 'Нельзя заблокировать самого себя'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Если блокируем пользователя (is_active = False)
    if target_user.is_active:
        # Проверяем, не последний ли это админ
        if target_user.is_admin():
            admin_count = User.objects.filter(role='admin', is_active=True).count()
            if admin_count <= 1:
                return Response(
                    {'success': False, 'error': 'Это последний пользователь с ролью администратор, его нельзя заблокировать'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        target_user.is_active = False
        target_user.save()
        
        return Response({
            'success': True,
            'message': f'Пользователь {target_user.username} заблокирован',
            'user': {
                'id': target_user.id,
                'username': target_user.username,
                'is_active': target_user.is_active,
            }
        })
    
    # Если разблокируем пользователя (is_active = True)
    else:
        target_user.is_active = True
        target_user.save()
        
        return Response({
            'success': True,
            'message': f'Пользователь {target_user.username} разблокирован',
            'user': {
                'id': target_user.id,
                'username': target_user.username,
                'is_active': target_user.is_active,
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

