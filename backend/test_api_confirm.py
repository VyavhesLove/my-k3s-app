#!/usr/bin/env python
"""Тест API подтверждения ТМЦ через Django test client."""
import os
import sys
import django

# Настройка Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'inventory.settings')
sys.path.insert(0, '/home/pvn/my-k3s-app/backend')
django.setup()

from django.test import Client, override_settings
from django.contrib.auth import get_user_model
from items.models import Item, Location
from items.enums import ItemStatus
from rest_framework_simplejwt.tokens import RefreshToken
from users.models import UserRole

User = get_user_model()

print("=== Тест API подтверждения ТМЦ ===")

# Создаём тестового пользователя (кладовщик)
user, created = User.objects.get_or_create(
    username='test_storekeeper',
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
location, _ = Location.objects.get_or_create(name='Test Warehouse')

# Создаём тестовый item со статусом CREATED
item = Item.objects.create(
    name='Test Item for Confirm',
    serial='TEST123',
    brand='TestBrand',
    status=ItemStatus.CREATED,
    location=location
)
print(f"Создан item: {item.id}, статус: {item.status}")

# Создаём тестовый клиент
client = Client()

# Аутентифицируем пользователя
refresh = RefreshToken.for_user(user)
access_token = str(refresh.access_token)
client.cookies['access_token'] = access_token

# Делаем запрос
url = f'/api/items/{item.id}/confirm-tmc/'
data = {'action': 'accept'}

print(f"\nОтправляем POST {url}")
print(f"Данные: {data}")
print(f"Токен: {access_token[:20]}...")

response = client.post(
    url,
    data=data,
    content_type='application/json',
    HTTP_AUTHORIZATION=f'Bearer {access_token}'
)

print(f"\nОтвет:")
print(f"  Status code: {response.status_code}")
print(f"  Content: {response.content.decode()}")

# Проверяем результат
if response.status_code == 200:
    item.refresh_from_db()
    print(f"\nПосле подтверждения:")
    print(f"  Статус: {item.status}")
    print(f"  Ответственный: {item.responsible}")

print("\n=== Тест завершён ===")

