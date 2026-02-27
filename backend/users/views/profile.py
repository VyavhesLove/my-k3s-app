"""Профиль, пароль и сессии текущего пользователя."""
import logging

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth import authenticate
from django.contrib.auth import get_user_model

# Модель UserSession определена в models_session.py для избежания циклических импортов
from ..models_session import UserSession

logger = logging.getLogger(__name__)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_current_user(request):
    """Возвращает расширенную информацию о текущем пользователе"""
    # ДЛЯ ОТЛАДКИ: Логируем информацию о пользователе
    logger.debug(f"[DEBUG /me] request.user = {request.user}")
    logger.debug(f"[DEBUG /me] request.user.id = {request.user.id}")
    logger.debug(f"[DEBUG /me] request.user.role = {request.user.role}")
    logger.debug(f"[DEBUG /me] type(request.user.role) = {type(request.user.role)}")
    logger.debug(f"[DEBUG /me] request.user.is_admin() = {request.user.is_admin()}")
    
    user = request.user
    
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

