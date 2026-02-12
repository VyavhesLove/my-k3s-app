from django.contrib import admin
from .models import Item, Location, Brigade, ItemHistory


@admin.register(Item)
class ItemAdmin(admin.ModelAdmin):
    list_display = ('name', 'serial', 'brand', 'status', 'responsible', 'location', 'brigade', 'locked_at', 'locked_by')
    search_fields = ('name', 'serial', 'responsible')
    list_filter = ('status', 'brand', 'location', 'brigade')


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

