from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User


@admin.register(User)
class CustomUserAdmin(UserAdmin):
    """Кастомная админка для пользователей."""
    list_display = ('username', 'email', 'first_name', 'last_name', 'surname', 'role', 'active', 'is_staff')
    list_filter = ('role', 'is_staff', 'is_active', 'active')
    fieldsets = (
        (None, {'fields': ('username', 'password')}),
        ('Персональная информация', {'fields': ('first_name', 'last_name', 'surname', 'email')}),
        ('Права доступа', {'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        ('Роль в системе', {'fields': ('role', 'active')}),
        ('Важные даты', {'fields': ('last_login', 'date_joined')}),
    )
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('username', 'password1', 'password2', 'role', 'active'),
        }),
    )
    search_fields = ('username', 'email', 'first_name', 'last_name', 'surname')
    ordering = ('username',)

