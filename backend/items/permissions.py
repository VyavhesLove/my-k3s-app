"""Permission классы для системы ТМЦ.

Разделение ответственности:
- Permission classes → проверяют роль пользователя (кладовщик, админ, бригадир)
- Commands → проверяют допустимость перехода статуса
"""
from rest_framework import permissions

from users.roles import UserRole


class IsStorekeeper(permissions.BasePermission):
    """
    Разрешает доступ только кладовщикам и администраторам.
    
    Используется для операций подтверждения ТМЦ.
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        # Администратор имеет все права
        if hasattr(request.user, 'role') and request.user.role == UserRole.ADMIN:
            return True
        
        # Кладовщик имеет права на подтверждение
        return hasattr(request.user, 'role') and request.user.role == UserRole.STOREKEEPER


class IsAdmin(permissions.BasePermission):
    """
    Разрешает доступ только администраторам.
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        return hasattr(request.user, 'role') and request.user.role == UserRole.ADMIN


class IsBrigadier(permissions.BasePermission):
    """
    Разрешает доступ только бригадирам и администраторам.
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        # Администратор имеет все права
        if hasattr(request.user, 'role') and request.user.role == UserRole.ADMIN:
            return True
        
        return hasattr(request.user, 'role') and request.user.role == UserRole.BRIGADIER


class IsAdminOrStorekeeper(permissions.BasePermission):
    """
    Разрешает доступ администраторам или кладовщикам.
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        return (
            hasattr(request.user, 'role') and 
            request.user.role in (UserRole.ADMIN, UserRole.STOREKEEPER)
        )


class IsAdminOrBrigadier(permissions.BasePermission):
    """
    Разрешает доступ администраторам или бригадирам.
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        return (
            hasattr(request.user, 'role') and 
            request.user.role in (UserRole.ADMIN, UserRole.BRIGADIER)
        )


class IsAuthenticatedWithRole(permissions.BasePermission):
    """
    Базовый класс - пользователь аутентифицирован и имеет роль.
    """
    def has_permission(self, request, view):
        return (
            request.user and 
            request.user.is_authenticated and 
            hasattr(request.user, 'role') and 
            request.user.role is not None
        )

