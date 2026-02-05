from django.contrib import admin
from .models import Item, Location, Brigade # 1. Добавляем Brigade в импорт

@admin.register(Item)
class ItemAdmin(admin.ModelAdmin):
    # 'brigade' — это то самое поле, которое мы добавили в 0001_initial.py
    list_display = ('name', 'serial', 'brand', 'status', 'responsible', 'location', 'brigade')
    search_fields = ('name', 'serial', 'responsible')
    list_filter = ('status', 'brand', 'location', 'brigade')

@admin.register(Location)
class LocationAdmin(admin.ModelAdmin):
    list_display = ('name',)
    search_fields = ('name',)

# 2. Добавляем новый блок для управления бригадами
@admin.register(Brigade)
class BrigadeAdmin(admin.ModelAdmin):
    # Колонки, которые будут видны в таблице бригад
    list_display = ('name', 'brigadier', 'responsible') 
    # По каким полям будет работать поиск в админке
    search_fields = ('name', 'brigadier', 'responsible')