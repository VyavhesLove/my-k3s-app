#!/usr/bin/env python
"""Тест serializer для ConfirmTMC."""
import os
import sys
import django

# Настройка Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'inventory.settings')
sys.path.insert(0, '/home/pvn/my-k3s-app/backend')
django.setup()

from items.serializers import ConfirmTMCSerializer

print("=== Тест ConfirmTMCSerializer ===")

# Тест с accept
s1 = ConfirmTMCSerializer(data={'action': 'accept'})
print(f"Test 1 - action='accept': is_valid={s1.is_valid()}, errors={s1.errors}, validated={s1.validated_data}")

# Тест с reject
s2 = ConfirmTMCSerializer(data={'action': 'reject'})
print(f"Test 2 - action='reject': is_valid={s2.is_valid()}, errors={s2.errors}, validated={s2.validated_data}")

# Тест с невалидным значением
s3 = ConfirmTMCSerializer(data={'action': 'invalid'})
print(f"Test 3 - action='invalid': is_valid={s3.is_valid()}, errors={s3.errors}")

# Тест с пустым телом
s4 = ConfirmTMCSerializer(data={})
print(f"Test 4 - empty body: is_valid={s4.is_valid()}, errors={s4.errors}")

# Тест без поля action
s5 = ConfirmTMCSerializer(data={'wrong_field': 'value'})
print(f"Test 5 - wrong field: is_valid={s5.is_valid()}, errors={s5.errors}")

print("\n=== Тест завершён ===")

