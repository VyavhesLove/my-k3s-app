"""CRUD операции для пользователей (только для администраторов)."""
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth import get_user_model

from ..serializers import CreateUserSerializer, UserResponseSerializer


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

