#!/usr/bin/env python
"""Скрипт для проверки и создания записей списания ТМЦ."""
import os
import sys
import django

# Настройка Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'inventory.settings')
django.setup()

from items.models import Item, Location, WriteOffRecord
from items.enums import ItemStatus
from django.contrib.auth import get_user_model
from datetime import date
from decimal import Decimal

User = get_user_model()


def check_current_state():
    """Проверить текущее состояние базы."""
    print('=== Текущее состояние базы ===')
    print(f'Всего ТМЦ: {Item.objects.count()}')
    print(f'ТМЦ со статусом WRITTEN_OFF: {Item.objects.filter(status=ItemStatus.WRITTEN_OFF).count()}')
    print(f'Записей о списании: {WriteOffRecord.objects.count()}')
    print()

    written_off_items = Item.objects.filter(status=ItemStatus.WRITTEN_OFF)
    if written_off_items.exists():
        print('=== Детали списанных ТМЦ ===')
        for item in written_off_items.select_related():
            write_off = item.write_off_records.filter(is_cancelled=False).first()
            print(f'ТМЦ: {item.name} (ID={item.id})')
            print(f'  Серийный: {item.serial}')
            print(f'  Статус: {item.status}')
            if write_off:
                print(f'  Запись списания ID: {write_off.id}')
                print(f'  Накладная: {write_off.invoice_number}')
                print(f'  Стоимость: {write_off.repair_cost}')
                print(f'  Дата списания: {write_off.date_written_off}')
                print(f'  Описание: {write_off.description}')
                print(f'  Создал: {write_off.created_by.username if write_off.created_by else "N/A"}')
            else:
                print(f'  Запись о списании: НЕТ (некорректное состояние!)')
            print()
    else:
        print('Нет ТМЦ со статусом WRITTEN_OFF')


def create_test_writeoff():
    """Создать тестовую запись списания через команду."""
    from items.services.commands import WriteOffCommand

    # Создаём тестового пользователя если его нет
    user, created = User.objects.get_or_create(
        username='admin',
        defaults={'is_staff': True, 'is_superuser': True}
    )
    if created:
        user.set_password('admin123')
        user.save()
        print(f'Создан пользователь admin с паролем admin123')

    # Создаём тестовую локацию
    location, _ = Location.objects.get_or_create(name='Склад 1')

    # Создаём ТМЦ в статусе ISSUED (допускающем списание)
    item = Item.objects.create(
        name='Тестовое ТМЦ для списания',
        serial='SN-TEST-001',
        brand='TestBrand',
        status=ItemStatus.ISSUED,
        location='Склад 1'
    )

    print(f'Создано ТМЦ: {item.name}, статус: {item.status}')

    # Списываем через команду
    item_id, write_off_id = WriteOffCommand.execute(
        item_id=item.id,
        invoice_number='Накладная-001',
        repair_cost=Decimal('1000.00'),
        date_to_service=date(2024, 1, 15),
        date_written_off=date.today(),
        description='Тестовое списание',
        user=user
    )

    # Проверяем результат
    item.refresh_from_db()
    write_off = WriteOffRecord.objects.get(id=write_off_id)

    print()
    print('=== Результат ===')
    print(f'ТМЦ: {item.name}')
    print(f'Статус ТМЦ: {item.status}')
    print(f'Запись списания ID: {write_off.id}')
    print(f'Накладная: {write_off.invoice_number}')
    print(f'Стоимость ремонта: {write_off.repair_cost}')
    print(f'Дата списания: {write_off.date_written_off}')
    print(f'Описание: {write_off.description}')
    print(f'Создал: {write_off.created_by.username}')

    return item, write_off


if __name__ == '__main__':
    if len(sys.argv) > 1 and sys.argv[1] == 'create':
        print('Создаю тестовую запись списания...')
        create_test_writeoff()
        print()
        print('После создания:')
        check_current_state()
    else:
        check_current_state()

