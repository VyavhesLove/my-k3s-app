#!/usr/bin/env python
"""Тест API через rest_framework APIClient."""
import os
import sys
import django

# Настройка Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'inventory.settings')
sys.path.insert(0, '/home/pvn/my-k3s-app/backend')
django.setup()

from rest_framework.test import APIClient
from django.contrib.auth import get_user_model
from items.models import Item, Location
from items.enums import ItemStatus
from rest_framework_simplejwt.tokens import RefreshToken
from users.models import UserRole

User = get_user_model()

print("=== Тест API через APIClient ===")

# Создаём тестового пользователя (кладовщик)
user, created = User.objects.get_or_create(
    username='test_storekeeper_api',
    defaults={
        'role': UserRole.STOREKEEPER,
        'is_staff': True
    }
)
if created:
    user.set_password('testpass123')
    user.save()
    print(f"Создан пользователь: {user.username}, роль: {user.role}")

# Создаём тестовую локацию
location, _ = Location.objects.get_or_create(name='Test Warehouse API')

# Создаём тестовый item со статусом CREATED
item = Item.objects.create(
    name='Test Item Confirm API',
    serial='TEST456',
    brand='TestBrand',
    status=ItemStatus.CREATED,
    location=location
)
print(f"Создан item: {item.id}, статус: {item.status}")

# Используем APIClient из DRF
client = APIClient()

# Аутентифицируем пользователя через JWT
refresh = RefreshToken.for_user(user)
access_token = str(refresh.access_token)
client.credentials(HTTP_AUTHORIZATION=f'Bearer {access_token}')

# Делаем запрос
url = f'/api/items/{item.id}/confirm-tmc/'
data = {'action': 'accept'}

print(f"\nОтправляем POST {url}")
print(f"Данные: {data}")
print(f"Токен: Bearer {access_token[:30]}...")

response = client.post(url, data=data, format='json')

print(f"\nОтвет:")
print(f"  Status code: {response.status_code}")
print(f"  Content: {response.content.decode()}")

# Проверяем результат
if response.status_code == 200:
    item.refresh_from_db()
    print(f"\nПосле подтверждения:")
    print(f"  Статус: {item.status}")
    print(f"  Ответственный: {item.responsible}")
else:
    print(f"\nОшибка! Код: {response.status_code}")

print("\n=== Тест завершён ===")

