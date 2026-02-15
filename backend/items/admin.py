from django.contrib import admin
from django.utils.html import format_html
from django.utils import timezone
from auditlog.models import LogEntry
from .models import Item, Location, Brigade, ItemHistory


@admin.register(Item)
class ItemAdmin(admin.ModelAdmin):
    list_display = ('name', 'serial', 'brand', 'status', 'responsible', 'location', 'brigade', 'locked_at', 'locked_by')
    search_fields = ('name', 'serial', 'responsible')
    list_filter = ('status', 'brand', 'location', 'brigade')
    readonly_fields = ('locked_by', 'locked_at')

    def get_readonly_fields(self, request, obj=None):
        """Добавляем auditlog_history в readonly поля только для просмотра"""
        readonly = list(super().get_readonly_fields(request, obj))
        if obj:  # Только при редактировании существующего объекта
            readonly.append('auditlog_history')
        return readonly

    def auditlog_history(self, obj):
        if not obj:
            return ""
        
        logs = LogEntry.objects.filter(object_id=str(obj.id)).order_by('-timestamp')[:10]
        if not logs:
            return "Нет записей"
        
        html_parts = []
        for log in logs:
            actor = log.actor.username if log.actor else "Система"
            changes_dict = log.changes
            if changes_dict:
                # Форматируем изменения в читаемый вид
                changes_str = ", ".join([
                    f"{k}: {v[0]} → {v[1]}" 
                    for k, v in changes_dict.items()
                ])
            else:
                changes_str = ""
            # Конвертируем время в локальный часовой пояс
            local_time = timezone.localtime(log.timestamp)
            html_parts.append(
                f"<b>{actor}</b> {log.get_action_display()} - {local_time.strftime('%d.%m.%Y %H:%M')}<br>"
                f"<span style='color: gray;'>{changes_str}</span><br>"
            )
        return format_html('<br>'.join(html_parts))
    
    auditlog_history.short_description = 'История изменений (auditlog)'


@admin.register(Location)
class LocationAdmin(admin.ModelAdmin):
    list_display = ('name',)
    search_fields = ('name',)


@admin.register(Brigade)
class BrigadeAdmin(admin.ModelAdmin):
    list_display = ('name', 'brigadier', 'responsible')
    search_fields = ('name', 'brigadier', 'responsible')


@admin.register(ItemHistory)
class ItemHistoryAdmin(admin.ModelAdmin):
    list_display = ('item', 'action', 'action_type', 'get_user', 'get_location', 'timestamp', 'comment')
    list_filter = ('action_type', 'user', 'location')
    raw_id_fields = ('user', 'location', 'item')

    def get_user(self, obj):
        return obj.user.username if obj.user else obj.user
    get_user.short_description = 'Пользователь'
    get_user.admin_order_field = 'user__username'

    def get_location(self, obj):
        return obj.location.name if obj.location else obj.location
    get_location.short_description = 'Локация'
    get_location.admin_order_field = 'location__name'

