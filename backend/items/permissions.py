"""Permission классы для системы ТМЦ.

Разделение ответственности:
- Permission classes → проверяют роль пользователя (кладовщик, админ, бригадир)
- Commands → проверяют допустимость перехода статуса
"""
from rest_framework import permissions


class IsStorekeeper(permissions.BasePermission):
    """
    Разрешает доступ только кладовщикам и администраторам.
    
    Используется для операций подтверждения ТМЦ.
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        # Администратор имеет все права
        if request.user.role == UserRole.ADMIN:
            return True
        
        # Кладовщик имеет права на подтверждение
        return request.user.role == UserRole.STOREKEEPER


class IsAdmin(permissions.BasePermission):
    """
    Разрешает доступ только администраторам.
    """
    def has_permission(self, request, view):
        return bool(
            request.user and 
            request.user.is_authenticated and 
            request.user.role == UserRole.ADMIN
        )


class IsForeman(permissions.BasePermission):
    """
    Разрешает доступ только бригадирам и администраторам.
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        # Администратор имеет все права
        if request.user.role == UserRole.ADMIN:
            return True
        
        return request.user.role == UserRole.FOREMAN


class IsAdminOrStorekeeper(permissions.BasePermission):
    """
    Разрешает доступ администраторам или кладовщикам.
    """
    def has_permission(self, request, view):
        return bool(
            request.user and 
            request.user.is_authenticated and 
            request.user.role in (UserRole.ADMIN, UserRole.STOREKEEPER)
        )


class IsAdminOrForeman(permissions.BasePermission):
    """
    Разрешает доступ администраторам или бригадирам.
    """
    def has_permission(self, request, view):
        return bool(
            request.user and 
            request.user.is_authenticated and 
            request.user.role in (UserRole.ADMIN, UserRole.FOREMAN)
        )


class IsAuthenticatedWithRole(permissions.BasePermission):
    """
    Базовый класс - пользователь аутентифицирован и имеет роль.
    """
    def has_permission(self, request, view):
        return bool(
            request.user and 
            request.user.is_authenticated and 
            request.user.role is not None
        )


# Импорт UserRole в конце, чтобы избежать циклических импортов
from users.models import UserRole

