from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User, LoginLog


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


@admin.register(LoginLog)
class LoginLogAdmin(admin.ModelAdmin):
    """Админка для логов входов."""
    list_display = ('timestamp', 'username', 'success', 'error_status', 'ip_address')
    list_filter = ('success', 'error_status', 'timestamp')
    search_fields = ('username', 'ip_address')
    readonly_fields = ('timestamp', 'username', 'success', 'error_status', 'ip_address', 'user_agent')
    ordering = ('-timestamp',)
    
    def has_add_permission(self, request):
        # Запрещаем создание записей вручную
        return False
    
    def has_change_permission(self, request, obj=None):
        # Разрешаем только просмотр
        return True
    
    def has_delete_permission(self, request, obj=None):
        # Запрещаем удаление
        return False

