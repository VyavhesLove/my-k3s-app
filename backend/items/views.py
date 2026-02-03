from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.db.models import Count, Q
import json
import sqlite3
import os

from .models import Item, Location

# Путь для работы в контейнере K3s (монтируется через PVC)
DB_PATH = "/data/inventory.db"


def init_db():
    """Инициализация БД - создание таблиц и миграция колонок"""
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    
    # 1. Создаем таблицу items
    conn.execute('''
        CREATE TABLE IF NOT EXISTS items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            serial TEXT,
            brand TEXT,
            status TEXT DEFAULT 'available',
            responsible TEXT,
            location TEXT,
            qty INTEGER DEFAULT 1
        )
    ''')

    # 2. Создаем таблицу locations
    # conn.execute('''
    #     CREATE TABLE IF NOT EXISTS items_location (
    #         id INTEGER PRIMARY KEY AUTOINCREMENT,
    #         name TEXT NOT NULL UNIQUE
    #     )
    # ''')

    # 3. Список локаций для заполнения (теперь через Django миграции)
    # default_locations = [...]

    # Заполняем локации - только через Django миграции/модели!

    # 4. Миграция колонок для items
    new_columns = [
        ('serial', 'TEXT'),
        ('brand', 'TEXT'),
        ('status', "TEXT DEFAULT 'available'"),
        ('responsible', 'TEXT'),
        ('location', 'TEXT')
    ]
    
    for col_name, col_type in new_columns:
        try:
            conn.execute(f'ALTER TABLE items ADD COLUMN {col_name} {col_type}')
        except sqlite3.OperationalError:
            pass
            
    conn.commit()
    conn.close()


@csrf_exempt
def item_list(request):
    """GET: список items, POST: создать item"""
    if request.method == 'GET':
        init_db()
        items = list(Item.objects.all().values())
        return JsonResponse({"items": items})
    
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            item = Item.objects.create(
                name=data.get('name'),
                serial=data.get('serial'),
                brand=data.get('brand'),
                status=data.get('status', 'available'),
                responsible=data.get('responsible'),
                location=data.get('location'),
                qty=data.get('qty', 1),
            )
            return JsonResponse({"status": "success", "id": item.id}, status=201)
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=400)
    
    return JsonResponse({"error": "Method not allowed"}, status=405)


@csrf_exempt
@require_http_methods(["DELETE"])
def delete_item(request, item_id):
    """Удалить item по ID"""
    try:
        item = Item.objects.get(id=item_id)
        item.delete()
        return JsonResponse({"status": "success"})
    except Item.DoesNotExist:
        return JsonResponse({"error": "Item not found"}, status=404)


@csrf_exempt
def item_detail(request, item_id):
    """PUT: обновить item, DELETE: удалить item"""
    try:
        item = Item.objects.get(id=item_id)
    except Item.DoesNotExist:
        return JsonResponse({"error": "Not found"}, status=404)

    if request.method == 'PUT':
        try:
            data = json.loads(request.body)
            item.name = data.get('name', item.name)
            item.serial = data.get('serial', item.serial)
            item.brand = data.get('brand', item.brand)
            item.location = data.get('location', item.location)
            item.responsible = data.get('responsible', item.responsible)
            item.save()
            return JsonResponse({"status": "success"})
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=400)
            
    if request.method == 'DELETE':
        try:
            item.delete()
            return JsonResponse({"status": "success"})
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=400)
    
    return JsonResponse({"error": "Method not allowed"}, status=405)


def hello(request):
    """Health check endpoint для Liveness Probe"""
    return JsonResponse({"status": "ok"})


@csrf_exempt
def location_list(request):
    """GET: список всех локаций для выпадающих списков через Django ORM"""
    if request.method == 'GET':
        locations = list(Location.objects.values('id', 'name').order_by('name'))
        return JsonResponse({"locations": locations})
    
    return JsonResponse({"error": "Method not allowed"}, status=405)


@csrf_exempt
def get_analytics(request):
    """Аналитика: группировка по брендам, локациям и статусам через Django ORM"""
    # 1. Получаем фильтры из URL
    name_f = request.GET.get('name', '')
    brand_f = request.GET.get('brand', '')
    loc_f = request.GET.get('location', '')

    # 2. Базовый запрос с фильтрацией через ORM
    queryset = Item.objects.filter(
        Q(name__icontains=name_f),
        Q(brand__icontains=brand_f),
        Q(location__icontains=loc_f)
    )

    # 3. Группировки (Django сам сделает правильный SQL)
    by_brand = list(queryset.values('brand').annotate(value=Count('id')).order_by('-value'))
    by_location = list(queryset.values('location').annotate(value=Count('id')).order_by('-value'))
    by_status = list(queryset.values('status').annotate(value=Count('id')).order_by('-value'))

    # 4. Детализация
    details = list(queryset.values('id', 'name', 'brand', 'location', 'status').order_by('-id'))

    # Для графиков Recharts нужно, чтобы ключи назывались как в модели
    # Если в базе NULL, заменим на текст для графиков
    for item in by_brand:
        item['brand'] = item['brand'] or 'Не указан'
    for item in by_location:
        item['location'] = item['location'] or 'Не указана'

    # Отладочная печать
    print(f"Analytics query result: {len(details)} items found")

    return JsonResponse({
        "by_brand": by_brand,
        "by_location": by_location,
        "by_status": by_status,
        "details": details
    })


