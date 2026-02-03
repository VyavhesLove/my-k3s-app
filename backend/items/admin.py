from django.contrib import admin
from .models import Item, Location

@admin.register(Item)
class ItemAdmin(admin.ModelAdmin):
    list_display = ('name', 'serial', 'brand', 'status', 'responsible', 'location')
    search_fields = ('name', 'serial', 'responsible')
    list_filter = ('status', 'brand', 'location')

@admin.register(Location)
class LocationAdmin(admin.ModelAdmin):
    list_display = ('name',)
    search_fields = ('name',)

