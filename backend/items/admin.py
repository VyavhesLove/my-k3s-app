from django.contrib import admin
from django.utils.html import format_html
from django.utils import timezone
from auditlog.models import LogEntry
from .models import Item, Location, Brigade, ItemHistory, WriteOffRecord, ServiceCenter, ErrorLog


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


@admin.register(WriteOffRecord)
class WriteOffRecordAdmin(admin.ModelAdmin):
    list_display = ('id', 'item', 'invoice_number', 'repair_cost', 'date_written_off', 'created_by', 'is_cancelled')
    list_filter = ('is_cancelled', 'date_written_off', 'location')
    search_fields = ('item__name', 'item__serial', 'invoice_number', 'description')
    raw_id_fields = ('item', 'location', 'created_by')
    readonly_fields = ('created_at',)

    def created_by(self, obj):
        return obj.created_by.username if obj.created_by else None
    created_by.short_description = 'Создал'
    created_by.admin_order_field = 'created_by__username'


@admin.register(ServiceCenter)
class ServiceCenterAdmin(admin.ModelAdmin):
    list_display = ('name', 'city', 'address')
    search_fields = ('name', 'city', 'address')


@admin.register(ErrorLog)
class ErrorLogAdmin(admin.ModelAdmin):
    list_display = ('timestamp', 'short_message', 'url_link', 'resolved_status', 'resolved')
    list_filter = ('resolved', 'timestamp')
    search_fields = ('message', 'stack_trace', 'url')
    list_editable = ('resolved',)
    readonly_fields = ('timestamp', 'url', 'message', 'user_agent', 'stack_trace_formatted')
    exclude = ('stack_trace',)
    date_hierarchy = 'timestamp'
    
    # Ссылка на страницу, где произошла ошибка
    def url_link(self, obj):
        return format_html('<a href="{0}" target="_blank">{1}</a>', obj.url, obj.url)
    url_link.short_description = "URL"
    
    # Короткое сообщение для списка
    def short_message(self, obj):
        return obj.message[:100] + '...' if len(obj.message) > 100 else obj.message
    short_message.short_description = "Сообщение"
    
    # Статус с цветовой индикацией
    def resolved_status(self, obj):
        color = '#22c55e' if obj.resolved else '#ef4444'
        text = 'Исправлено' if obj.resolved else 'Критично'
        return format_html('<span style="color: {0}; font-weight: bold;">{1}</span>', color, text)
    resolved_status.short_description = "Статус"
    
    # Форматированный стек-трейс с подсветкой
    def stack_trace_formatted(self, obj):
        if not obj.stack_trace:
            return "Нет данных"
        return format_html(
            '<pre style="background: #1e293b; color: #f1f5f9; padding: 15px; border-radius: 8px; '
            'font-family: monospace; font-size: 12px; line-height: 1.5; overflow-x: auto; '
            'border-left: 4px solid #ef4444;">{0}</pre>',
            obj.stack_trace
        )
    stack_trace_formatted.short_description = "Stack Trace (Debug Info)"

