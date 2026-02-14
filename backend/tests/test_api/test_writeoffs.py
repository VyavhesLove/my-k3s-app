"""
Интеграционные тесты для WriteOff API.

Покрывает:
- POST /writeoffs/ — создание записи о списании
- POST /writeoffs/{id}/cancel/ — отмена записи о списании
- GET /writeoffs/ — список записей о списании
- Фильтрация по status, location, date

Тесты ролей:
- storekeeper — полный доступ (201/200)
- foreman — 403 Forbidden
- anonymous — 401 Unauthorized
"""
from datetime import date, timedelta
from decimal import Decimal
from rest_framework.test import APITestCase
from django.contrib.auth import get_user_model
from items.models import Item, WriteOffRecord, Location
from items.enums import ItemStatus
from items.services.commands import WriteOffCommand
from users.models import UserRole

User = get_user_model()


class WriteOffListAPITestCase(APITestCase):
    """Интеграционные тесты для GET /writeoffs/."""

    def setUp(self):
        """Подготовка тестовых данных."""
        # Создаём кладовщика
        self.storekeeper = User.objects.create_user(
            username="keeper",
            password="123",
            role=UserRole.STOREKEEPER
        )
        
        # Создаём бригадира (для тестов 403)
        self.foreman = User.objects.create_user(
            username="foreman",
            password="123",
            role=UserRole.FOREMAN
        )
        
        # Создаём локации
        self.location1 = Location.objects.create(name="Склад 1")
        self.location2 = Location.objects.create(name="Склад 2")
        
        # Создаём ТМЦ
        self.item1 = Item.objects.create(
            name="Test Laptop 1",
            serial="SN001",
            status=ItemStatus.AVAILABLE,
            location="Склад 1"
        )
        self.item2 = Item.objects.create(
            name="Test Laptop 2",
            serial="SN002",
            status=ItemStatus.AVAILABLE,
            location="Склад 2"
        )
        
        # Создаём записи о списании
        self.write_off1 = WriteOffRecord.objects.create(
            item=self.item1,
            location=self.location1,
            repair_cost=Decimal("1000.00"),
            invoice_number="INV-001",
            date_to_service=date.today(),
            date_written_off=date.today(),
            created_by=self.storekeeper,
            is_cancelled=False
        )
        
        self.write_off2 = WriteOffRecord.objects.create(
            item=self.item2,
            location=self.location2,
            repair_cost=Decimal("2000.00"),
            invoice_number="INV-002",
            date_to_service=date.today() - timedelta(days=1),
            date_written_off=date.today() - timedelta(days=1),
            created_by=self.storekeeper,
            is_cancelled=False
        )
        
        # Отменённая запись
        self.write_off_cancelled = WriteOffRecord.objects.create(
            item=self.item1,
            location=self.location1,
            repair_cost=Decimal("500.00"),
            invoice_number="INV-003",
            date_to_service=date.today() - timedelta(days=2),
            date_written_off=date.today() - timedelta(days=2),
            created_by=self.storekeeper,
            is_cancelled=True
        )

    def test_list_writeoffs_success_for_storekeeper(self):
        """Успешное получение списка записей о списании кладовщиком."""
        self.client.force_authenticate(self.storekeeper)
        
        response = self.client.get('/api/writeoffs/')
        
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["success"], True)
        data = response.data['data']
        # По умолчанию показываем все записи (активные + отменённые)
        self.assertEqual(len(data['write_offs']), 3)

    def test_list_writeoffs_forbidden_for_foreman(self):
        """403 для бригадира при получении списка."""
        self.client.force_authenticate(self.foreman)
        
        response = self.client.get('/api/writeoffs/')
        
        self.assertEqual(response.status_code, 403)

    def test_list_writeoffs_unauthenticated(self):
        """401 для неаутентифицированного пользователя."""
        response = self.client.get('/api/writeoffs/')
        
        self.assertEqual(response.status_code, 401)

    def test_filter_by_is_cancelled_false(self):
        """Фильтрация по активным записям (is_cancelled=false)."""
        self.client.force_authenticate(self.storekeeper)
        
        response = self.client.get('/api/writeoffs/?is_cancelled=false')
        
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["success"], True)
        data = response.data['data']
        # Только активные записи (не отменённые)
        write_offs = data['write_offs']
        self.assertEqual(len(write_offs), 2)
        for wo in write_offs:
            self.assertEqual(wo['is_cancelled'], False)

    def test_filter_by_is_cancelled_true(self):
        """Фильтрация по отменённым записям (is_cancelled=true)."""
        self.client.force_authenticate(self.storekeeper)
        
        response = self.client.get('/api/writeoffs/?is_cancelled=true')
        
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["success"], True)
        data = response.data['data']
        # Только отменённые записи
        write_offs = data['write_offs']
        self.assertEqual(len(write_offs), 1)
        self.assertEqual(write_offs[0]['is_cancelled'], True)

    def test_filter_by_location(self):
        """Фильтрация по локации."""
        self.client.force_authenticate(self.storekeeper)
        
        response = self.client.get('/api/writeoffs/?location=Склад 1')
        
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["success"], True)
        data = response.data['data']
        # Только записи со склада 1
        write_offs = data['write_offs']
        self.assertEqual(len(write_offs), 2)

    def test_filter_by_date(self):
        """Фильтрация по дате списания."""
        self.client.force_authenticate(self.storekeeper)
        
        today_str = date.today().isoformat()
        response = self.client.get(f'/api/writeoffs/?date={today_str}')
        
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["success"], True)
        data = response.data['data']
        # Только записи с сегодняшней датой (только write_off1 - отменённая имеет дату 2 дня назад)
        write_offs = data['write_offs']
        self.assertEqual(len(write_offs), 1)

    def test_filter_combined(self):
        """Комбинированная фильтрация."""
        self.client.force_authenticate(self.storekeeper)
        
        today_str = date.today().isoformat()
        response = self.client.get(
            f'/api/writeoffs/?is_cancelled=false&location=Склад 1&date={today_str}'
        )
        
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["success"], True)
        data = response.data['data']
        write_offs = data['write_offs']
        self.assertEqual(len(write_offs), 1)


class WriteOffCreateAPITestCase(APITestCase):
    """Интеграционные тесты для POST /writeoffs/."""

    def setUp(self):
        """Подготовка тестовых данных."""
        self.storekeeper = User.objects.create_user(
            username="keeper",
            password="123",
            role=UserRole.STOREKEEPER
        )
        
        self.foreman = User.objects.create_user(
            username="foreman",
            password="123",
            role=UserRole.FOREMAN
        )
        
        # ТМЦ со статусом ISSUED для списания (списание допустимо только из ISSUED, AT_WORK, IN_REPAIR)
        self.item = Item.objects.create(
            name="Test Laptop",
            serial="SN12345",
            status=ItemStatus.ISSUED,
            location="Warehouse"
        )

    def test_create_writeoff_success(self):
        """Успешное создание записи о списании кладовщиком."""
        self.client.force_authenticate(self.storekeeper)
        
        response = self.client.post(
            '/api/writeoffs/',
            {
                'item_id': self.item.id,
                'invoice_number': 'INV-001',
                'repair_cost': 1000.00,  # float instead of string
                'description': 'Списание за непригодностью'
            },
            format='json'
        )
        
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data["success"], True)
        data = response.data['data']
        self.assertEqual(data['invoice_number'], 'INV-001')
        self.assertFalse(data['is_cancelled'])
        
        # Проверяем, что ТМЦ перешло в статус WRITTEN_OFF
        self.item.refresh_from_db()
        self.assertEqual(self.item.status, ItemStatus.WRITTEN_OFF)

    def test_create_writeoff_forbidden_for_foreman(self):
        """403 для бригадира при создании записи."""
        self.client.force_authenticate(self.foreman)
        
        response = self.client.post(
            '/api/writeoffs/',
            {
                'item_id': self.item.id,
                'invoice_number': 'INV-001',
            },
            format='json'
        )
        
        self.assertEqual(response.status_code, 403)

    def test_create_writeoff_unauthenticated(self):
        """401 для неаутентифицированного пользователя."""
        response = self.client.post(
            '/api/writeoffs/',
            {
                'item_id': self.item.id,
                'invoice_number': 'INV-001',
            },
            format='json'
        )
        
        self.assertEqual(response.status_code, 401)

    def test_create_writeoff_missing_item_id(self):
        """400 при отсутствии item_id."""
        self.client.force_authenticate(self.storekeeper)
        
        response = self.client.post(
            '/api/writeoffs/',
            {
                'invoice_number': 'INV-001',
            },
            format='json'
        )
        
        self.assertEqual(response.status_code, 400)

    def test_create_writeoff_invalid_item(self):
        """400 при несуществующем item_id."""
        self.client.force_authenticate(self.storekeeper)
        
        response = self.client.post(
            '/api/writeoffs/',
            {
                'item_id': 99999,
                'invoice_number': 'INV-001',
            },
            format='json'
        )
        
        self.assertEqual(response.status_code, 400)

    def test_create_writeoff_already_written_off_returns_409(self):
        """409 при попытке повторного списания уже списанного Item."""
        # Arrange - сначала списываем Item
        WriteOffCommand.execute(
            item_id=self.item.id,
            invoice_number="INV-FIRST",
            user=self.storekeeper
        )
        
        # Обновляем item из базы
        self.item.refresh_from_db()
        self.assertEqual(self.item.status, ItemStatus.WRITTEN_OFF)
        
        # Act - пытаемся списать снова
        self.client.force_authenticate(self.storekeeper)
        response = self.client.post(
            '/api/writeoffs/',
            {
                'item_id': self.item.id,
                'invoice_number': 'INV-SECOND',
            },
            format='json'
        )
        
        # Assert - должен вернуться 409 Conflict
        self.assertEqual(response.status_code, 409)
        self.assertEqual(response.data["success"], False)
        self.assertEqual(response.data["error"], "Item уже списан")


class WriteOffCancelAPITestCase(APITestCase):
    """Интеграционные тесты для POST /writeoffs/{id}/cancel/."""

    def setUp(self):
        """Подготовка тестовых данных."""
        self.storekeeper = User.objects.create_user(
            username="keeper",
            password="123",
            role=UserRole.STOREKEEPER
        )
        
        self.foreman = User.objects.create_user(
            username="foreman",
            password="123",
            role=UserRole.FOREMAN
        )
        
        self.admin = User.objects.create_user(
            username="admin",
            password="123",
            role=UserRole.ADMIN
        )
        
        self.location = Location.objects.create(name="Test Location")
        
        # Создаём Item со статусом ISSUED (списание допустимо из ISSUED, AT_WORK, IN_REPAIR)
        self.item = Item.objects.create(
            name="Test Laptop",
            serial="SN12345",
            status=ItemStatus.ISSUED,
            location="Warehouse"
        )
        
        # Используем WriteOffCommand.execute() для создания записи о списании
        # Это также переведёт Item в статус WRITTEN_OFF
        from items.services.commands import WriteOffCommand
        item_id, write_off_id = WriteOffCommand.execute(
            item_id=self.item.id,
            invoice_number="INV-001",
            repair_cost=Decimal("1000.00"),
            date_written_off=date.today(),
            user=self.storekeeper
        )
        
        # Получаем созданную запись о списании
        self.write_off = WriteOffRecord.objects.get(id=write_off_id)

    def test_cancel_writeoff_success(self):
        """Успешная отмена списания кладовщиком."""
        self.client.force_authenticate(self.storekeeper)
        
        response = self.client.post(
            f'/api/writeoffs/{self.write_off.id}/cancel/'
        )
        
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["success"], True)
        
        # Проверяем, что запись отменена
        self.write_off.refresh_from_db()
        self.assertTrue(self.write_off.is_cancelled)
        self.assertIsNotNone(self.write_off.cancelled_at)
        
        # Проверяем, что ТМЦ вернулось в статус AVAILABLE
        self.item.refresh_from_db()
        self.assertEqual(self.item.status, ItemStatus.AVAILABLE)

    def test_cancel_writeoff_admin_has_access(self):
        """Администратор может отменить списание."""
        self.client.force_authenticate(self.admin)
        
        response = self.client.post(
            f'/api/writeoffs/{self.write_off.id}/cancel/'
        )
        
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["success"], True)
        self.write_off.refresh_from_db()
        self.assertTrue(self.write_off.is_cancelled)

    def test_cancel_writeoff_forbidden_for_foreman(self):
        """403 для бригадира при отмене списания."""
        self.client.force_authenticate(self.foreman)
        
        response = self.client.post(
            f'/api/writeoffs/{self.write_off.id}/cancel/'
        )
        
        self.assertEqual(response.status_code, 403)

    def test_cancel_writeoff_unauthenticated(self):
        """401 для неаутентифицированного пользователя."""
        response = self.client.post(
            f'/api/writeoffs/{self.write_off.id}/cancel/'
        )
        
        self.assertEqual(response.status_code, 401)

    def test_cancel_writeoff_not_found(self):
        """404 при отмене несуществующей записи."""
        self.client.force_authenticate(self.storekeeper)
        
        response = self.client.post(
            '/api/writeoffs/99999/cancel/'
        )
        
        # Запись о списании не найдена - 404
        self.assertEqual(response.status_code, 404)

