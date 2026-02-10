from django.test import TestCase
from django.urls import reverse
from django.utils import timezone
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from django.contrib.auth.models import User
from rest_framework.permissions import AllowAny
from .models import Brigade, Item, Location
import datetime

class BrigadeAPITests(APITestCase):
    def setUp(self):
        # Подготовка данных (выполняется перед каждым тестом)
        self.list_url = reverse('brigade_list') # Предполагаем, что в urls.py name='brigade_list'
        self.valid_payload = {
            'name': 'Бригада №1',
            'brigadier': 'Алексей',
            'responsible': 'Дмитрий'
        }
        
        # Создаем тестового пользователя
        self.user = User.objects.create_user(username='testuser', password='password123')
        self.client.force_authenticate(user=self.user)

    def test_create_brigade_success(self):
        """Проверка успешного создания бригады через POST"""
        response = self.client.post(self.list_url, self.valid_payload, format='json')
        
        # Проверяем статус ответа
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        # Проверяем, что в базе теперь реально 1 запись
        self.assertEqual(Brigade.objects.count(), 1)
        # Проверяем имя сохраненной бригады
        self.assertEqual(Brigade.objects.get().name, 'Бригада №1')

    def test_create_duplicate_brigade_fails(self):
        """Проверка, что нельзя создать две бригады с одинаковым именем"""
        # Создаем первую бригаду
        Brigade.objects.create(**self.valid_payload)
        
        # Пытаемся создать такую же через API
        response = self.client.post(self.list_url, self.valid_payload, format='json')
        
        # Должна быть ошибка 400 (Bad Request), так как name у нас unique=True
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class LocationAPITests(APITestCase):
    """Тесты для /api/locations GET"""
    authentication_classes = []
    permission_classes = [AllowAny]
    
    def setUp(self):
        self.list_url = '/api/locations'
        
        # Создаем тестового пользователя
        self.user = User.objects.create_user(username='testuser', password='password123')
        self.client.force_authenticate(user=self.user)
        
        # Создаем тестовые локации
        self.location1 = Location.objects.create(name='Склад №1')
        self.location2 = Location.objects.create(name='Склад №2')
        self.location3 = Location.objects.create(name='Офис')

    def test_get_locations_success(self):
        """Проверка успешного получения списка локаций"""
        response = self.client.get(self.list_url, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('locations', response.data)
        self.assertEqual(len(response.data['locations']), 3)
        
        # Проверяем, что все созданные локации присутствуют в ответе
        location_names = [loc['name'] for loc in response.data['locations']]
        self.assertIn('Склад №1', location_names)
        self.assertIn('Склад №2', location_names)
        self.assertIn('Офис', location_names)

    def test_get_locations_empty_list(self):
        """Проверка получения пустого списка локаций"""
        Location.objects.all().delete()
        
        response = self.client.get(self.list_url, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['locations'], [])

    def test_get_locations_response_structure(self):
        """Проверка структуры ответа"""
        response = self.client.get(self.list_url, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('locations', response.data)
        self.assertIsInstance(response.data['locations'], list)
        
        # Проверяем структуру одной локации
        if response.data['locations']:
            location = response.data['locations'][0]
            self.assertIn('id', location)
            self.assertIn('name', location)

    def test_get_locations_sorted_by_name(self):
        """Проверка сортировки локаций по имени"""
        response = self.client.get(self.list_url, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Проверяем что список отсортирован по имени
        location_names = [loc['name'] for loc in response.data['locations']]
        self.assertEqual(location_names, sorted(location_names))

    def test_get_locations_no_auth_required(self):
        """Проверка что доступ к локациям не требует аутентификации"""
        # Не аутентифицируем пользователя
        response = self.client.get(self.list_url, format='json')
        
        # Должен вернуться 200, а не 401 или 403
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('locations', response.data)


class ItemAPITests(APITestCase):
    def setUp(self):
        # Подготовка данных перед каждым тестом
        self.list_url = '/api/items'
        
        # Создаем тестового пользователя для аутентификации
        self.user = User.objects.create_user(
            username='testuser',
            password='testpass123'
        )
        
        # Создаем тестовые локации
        self.location1 = Location.objects.create(name='Склад №1')
        self.location2 = Location.objects.create(name='Склад №2')
        
        # Создаем тестовые items
        self.item1 = Item.objects.create(
            name='Ноутбук Dell',
            serial='SN12345',
            brand='Dell',
            status='available',
            location='Склад №1',
            qty=2
        )
        self.item2 = Item.objects.create(
            name='Монитор Samsung',
            serial='SN67890',
            brand='Samsung',
            status='issued',
            responsible='Иванов И.И.',
            location='Склад №2',
            qty=1
        )
        self.item3 = Item.objects.create(
            name='Клавиатура Logitech',
            serial='SN11111',
            brand='Logitech',
            status='at_work',
            responsible='Петров П.П.',
            location='Офис',
            qty=5
        )

    def test_get_items_list_empty(self):
        """Проверка получения пустого списка items"""
        # Удаляем все items для этого теста
        Item.objects.all().delete()
        
        self.client.force_authenticate(user=self.user)
        response = self.client.get(self.list_url, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['items'], [])

    def test_get_items_list_success(self):
        """Проверка успешного получения списка items"""
        self.client.force_authenticate(user=self.user)
        response = self.client.get(self.list_url, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['items']), 3)
        
        # Проверяем, что все созданные items присутствуют в ответе
        item_names = [item['name'] for item in response.data['items']]
        self.assertIn('Ноутбук Dell', item_names)
        self.assertIn('Монитор Samsung', item_names)
        self.assertIn('Клавиатура Logitech', item_names)

    def test_get_items_search_by_name(self):
        """Проверка поиска items по названию"""
        self.client.force_authenticate(user=self.user)
        response = self.client.get(f'{self.list_url}?search=Dell', format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['items']), 1)
        self.assertEqual(response.data['items'][0]['name'], 'Ноутбук Dell')

    def test_get_items_search_partial(self):
        """Проверка частичного поиска items"""
        self.client.force_authenticate(user=self.user)
        response = self.client.get(f'{self.list_url}?search=Ноут', format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['items']), 1)
        self.assertEqual(response.data['items'][0]['name'], 'Ноутбук Dell')

    def test_get_items_search_by_status(self):
        """Проверка поиска items по статусу"""
        self.client.force_authenticate(user=self.user)
        response = self.client.get(f'{self.list_url}?search=at_work', format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['items']), 1)
        self.assertEqual(response.data['items'][0]['name'], 'Клавиатура Logitech')
        self.assertEqual(response.data['items'][0]['status'], 'at_work')

    def test_get_items_search_no_results(self):
        """Проверка поиска items когда ничего не найдено"""
        self.client.force_authenticate(user=self.user)
        response = self.client.get(f'{self.list_url}?search=НесуществующийТовар', format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['items']), 0)

    def test_get_items_response_structure(self):
        """Проверка структуры ответа"""
        self.client.force_authenticate(user=self.user)
        response = self.client.get(self.list_url, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('items', response.data)
        self.assertIsInstance(response.data['items'], list)
        
        # Проверяем структуру одного item
        if response.data['items']:
            item = response.data['items'][0]
            self.assertIn('id', item)
            self.assertIn('name', item)
            self.assertIn('serial', item)
            self.assertIn('brand', item)
            self.assertIn('status', item)
            self.assertIn('location', item)
            self.assertIn('qty', item)

    # ========== POST TESTS ==========

    def test_create_item_success(self):
        """Проверка успешного создания item через POST"""
        self.client.force_authenticate(user=self.user)
        
        valid_payload = {
            'name': 'Новый ноутбук HP',
            'serial': 'SN99999',
            'brand': 'HP',
            'status': 'available',
            'location': 'Склад №1',
            'qty': 3
        }
        
        response = self.client.post(self.list_url, valid_payload, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Item.objects.count(), 4)
        self.assertEqual(Item.objects.last().name, 'Новый ноутбук HP')
        self.assertEqual(response.data['name'], 'Новый ноутбук HP')
        self.assertEqual(response.data['brand'], 'HP')
        self.assertEqual(response.data['status'], 'available')

    def test_create_item_minimal_data(self):
        """Проверка создания item с минимальными данными"""
        self.client.force_authenticate(user=self.user)
        
        minimal_payload = {
            'name': 'Просто товар',
            'qty': 1
        }
        
        response = self.client.post(self.list_url, minimal_payload, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Item.objects.count(), 4)
        self.assertEqual(Item.objects.last().name, 'Просто товар')
        self.assertEqual(Item.objects.last().qty, 1)
        # Проверяем дефолтные значения
        self.assertEqual(Item.objects.last().status, 'available')

    def test_create_item_with_brigade(self):
        """Проверка создания item с привязкой к бригаде"""
        self.client.force_authenticate(user=self.user)
        
        # Создаем бригаду
        brigade = Brigade.objects.create(
            name='Бригада №5',
            brigadier='Тест Тестов',
            responsible='Тест Тестер'
        )
        
        payload = {
            'name': 'Инструмент',
            'serial': 'SN111',
            'brand': 'Bosch',
            'status': 'at_work',
            'brigade': brigade.id
        }
        
        response = self.client.post(self.list_url, payload, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['brigade'], brigade.id)
        self.assertEqual(Item.objects.last().brigade, brigade)

    def test_create_item_invalid_status(self):
        """Проверка ошибки при неверном статусе"""
        self.client.force_authenticate(user=self.user)
        
        invalid_payload = {
            'name': 'Товар с ошибкой',
            'status': 'invalid_status',
            'qty': 1
        }
        
        response = self.client.post(self.list_url, invalid_payload, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('status', response.data)

    def test_create_item_missing_name(self):
        """Проверка ошибки при отсутствии обязательного поля name"""
        self.client.force_authenticate(user=self.user)
        
        invalid_payload = {
            'serial': 'SN000',
            'qty': 1
        }
        
        response = self.client.post(self.list_url, invalid_payload, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('name', response.data)

    # ========== PUT TESTS ==========

    def test_update_item_single_field(self):
        """Проверка частичного обновления одного поля"""
        self.client.force_authenticate(user=self.user)
        
        item = Item.objects.first()
        detail_url = f'{self.list_url}/{item.id}/'
        
        response = self.client.put(detail_url, {'name': 'Обновленный ноутбук'}, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['name'], 'Обновленный ноутбук')
        
        # Проверяем в базе
        item.refresh_from_db()
        self.assertEqual(item.name, 'Обновленный ноутбук')
        # Остальные поля не изменились
        self.assertEqual(item.brand, 'Dell')
        self.assertEqual(item.serial, 'SN12345')

    def test_update_item_status(self):
        """Проверка обновления статуса item"""
        self.client.force_authenticate(user=self.user)
        
        item = Item.objects.get(name='Ноутбук Dell')
        detail_url = f'{self.list_url}/{item.id}/'
        
        response = self.client.put(detail_url, {'status': 'issued'}, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], 'issued')
        
        # Проверяем в базе
        item.refresh_from_db()
        self.assertEqual(item.status, 'issued')

    def test_update_item_all_fields(self):
        """Проверка обновления всех полей"""
        self.client.force_authenticate(user=self.user)
        
        item = Item.objects.first()
        detail_url = f'{self.list_url}/{item.id}/'
        
        update_payload = {
            'name': 'Полностью обновленный товар',
            'serial': 'SN_NEW_123',
            'brand': 'Apple',
            'status': 'in_repair',
            'responsible': 'Сидоров С.С.',
            'location': 'Ремонтный цех',
            'qty': 10
        }
        
        response = self.client.put(detail_url, update_payload, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['name'], 'Полностью обновленный товар')
        self.assertEqual(response.data['serial'], 'SN_NEW_123')
        self.assertEqual(response.data['brand'], 'Apple')
        self.assertEqual(response.data['status'], 'in_repair')
        self.assertEqual(response.data['responsible'], 'Сидоров С.С.')
        self.assertEqual(response.data['location'], 'Ремонтный цех')
        self.assertEqual(response.data['qty'], 10)

    def test_update_item_with_brigade(self):
        """Проверка привязки item к бригаде при обновлении"""
        self.client.force_authenticate(user=self.user)
        
        # Создаем бригаду
        brigade = Brigade.objects.create(
            name='Бригада Монтажников',
            brigadier='Монтажников М.М.',
            responsible='Монтажников М.М.'
        )
        
        item = Item.objects.get(name='Ноутбук Dell')
        detail_url = f'{self.list_url}/{item.id}/'
        
        response = self.client.put(detail_url, {'brigade': brigade.id}, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['brigade'], brigade.id)
        
        # Проверяем в базе
        item.refresh_from_db()
        self.assertEqual(item.brigade, brigade)

    def test_update_item_invalid_status(self):
        """Проверка ошибки при неверном статусе"""
        self.client.force_authenticate(user=self.user)
        
        item = Item.objects.first()
        detail_url = f'{self.list_url}/{item.id}/'
        
        response = self.client.put(detail_url, {'status': 'несуществующий_статус'}, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('status', response.data)

    def test_update_item_not_found(self):
        """Проверка ошибки 404 при обновлении несуществующего item"""
        self.client.force_authenticate(user=self.user)
        
        detail_url = f'{self.list_url}/99999/'
        
        response = self.client.put(detail_url, {'name': 'Несуществующий товар'}, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_update_item_qty_increments(self):
        """Проверка обновления количества (increment)"""
        self.client.force_authenticate(user=self.user)
        
        item = Item.objects.first()
        detail_url = f'{self.list_url}/{item.id}/'
        original_qty = item.qty
        
        response = self.client.put(detail_url, {'qty': original_qty + 5}, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['qty'], original_qty + 5)
        
        # Проверяем в базе
        item.refresh_from_db()
        self.assertEqual(item.qty, original_qty + 5)

    # ========== DELETE TESTS ==========

    def test_delete_item_success(self):
        """Проверка успешного удаления item"""
        self.client.force_authenticate(user=self.user)
        
        item = Item.objects.first()
        detail_url = f'{self.list_url}/{item.id}/'
        initial_count = Item.objects.count()
        
        response = self.client.delete(detail_url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], 'success')
        self.assertEqual(Item.objects.count(), initial_count - 1)
        # Проверяем что item удален из базы
        self.assertFalse(Item.objects.filter(id=item.id).exists())

    def test_delete_item_not_found(self):
        """Проверка ошибки 404 при удалении несуществующего item"""
        self.client.force_authenticate(user=self.user)
        
        detail_url = f'{self.list_url}/99999/'
        
        response = self.client.delete(detail_url)
        
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_delete_item_and_verify_list(self):
        """Проверка что список items уменьшился после удаления"""
        self.client.force_authenticate(user=self.user)
        
        initial_count = Item.objects.count()
        # Удаляем первый item
        item = Item.objects.first()
        detail_url = f'{self.list_url}/{item.id}/'
        
        response = self.client.delete(detail_url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(Item.objects.count(), initial_count - 1)
        
        # Проверяем что оставшиеся items присутствуют в списке
        list_response = self.client.get(self.list_url, format='json')
        self.assertEqual(len(list_response.data['items']), initial_count - 1)
        
        # Проверяем что удаленный item отсутствует в списке
        item_names = [i['name'] for i in list_response.data['items']]
        self.assertNotIn(item.name, item_names)

    def test_delete_item_cascade_to_brigade(self):
        """Проверка что привязанная бригада не удаляется вместе с item"""
        self.client.force_authenticate(user=self.user)
        
        # Создаем бригаду
        brigade = Brigade.objects.create(
            name='Бригада Удаляторов',
            brigadier='Удаляторов У.У.',
            responsible='Удаляторов У.У.'
        )
        
        # Привязываем item к бригаде
        item = Item.objects.first()
        item.brigade = brigade
        item.save()
        
        detail_url = f'{self.list_url}/{item.id}/'
        
        response = self.client.delete(detail_url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Item должен быть удален
        self.assertFalse(Item.objects.filter(id=item.id).exists())
        # Но бригада должна остаться
        self.assertTrue(Brigade.objects.filter(id=brigade.id).exists())

    def test_delete_multiple_items(self):
        """Проверка удаления нескольких items"""
        self.client.force_authenticate(user=self.user)
        
        initial_count = Item.objects.count()
        
        # Удаляем первые 2 items
        items_to_delete = Item.objects.all()[:2]
        for item in items_to_delete:
            detail_url = f'{self.list_url}/{item.id}/'
            response = self.client.delete(detail_url)
            self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        self.assertEqual(Item.objects.count(), initial_count - 2)


class ItemLockTests(APITestCase):
    """Тесты для блокировки/разблокировки ТМЦ"""
    
    def setUp(self):
        """Создаём пользователей и ТМЦ"""
        # Обычные пользователи
        self.user1 = User.objects.create_user(username='user1', password='pass123')
        self.user2 = User.objects.create_user(username='user2', password='pass123')
        self.admin = User.objects.create_superuser(username='admin', password='pass123')
        
        # ТМЦ
        self.item = Item.objects.create(
            name='Ноутбук Dell',
            status='available',
            qty=1
        )
        
        self.url_lock = reverse('lock_item', kwargs={'item_id': self.item.id})
        self.url_unlock = reverse('unlock_item', kwargs={'item_id': self.item.id})
    
    def test_lock_item_success(self):
        """✅ User1 блокирует свободный ТМЦ"""
        self.client.force_authenticate(user=self.user1)
        
        response = self.client.post(self.url_lock)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], 'locked')
        self.assertEqual(response.data['locked_by'], 'user1')
        
        # Проверяем в БД
        item = Item.objects.get(id=self.item.id)
        self.assertEqual(item.locked_by, self.user1)
        self.assertIsNotNone(item.locked_at)
    
    def test_lock_item_already_locked_other_user(self):
        """❌ User2 пытается заблокировать ТМЦ User1"""
        # User1 блокирует
        self.client.force_authenticate(user=self.user1)
        self.client.post(self.url_lock)
        
        # User2 пытается
        self.client.force_authenticate(user=self.user2)
        response = self.client.post(self.url_lock)
        
        self.assertEqual(response.status_code, status.HTTP_423_LOCKED)
        self.assertIn('user1', response.data['error'])
    
    def test_unlock_item_success_owner(self):
        """✅ User1 разблокирует свой ТМЦ"""
        # Блокируем
        self.client.force_authenticate(user=self.user1)
        self.client.post(self.url_lock)
        
        # Разблокируем
        response = self.client.post(self.url_unlock)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], 'unlocked')
        
        item = Item.objects.get(id=self.item.id)
        self.assertIsNone(item.locked_by)
        self.assertIsNone(item.locked_at)
    
    def test_unlock_item_admin_success(self):
        """✅ Admin разблокирует чужой ТМЦ"""
        # User1 блокирует
        self.client.force_authenticate(user=self.user1)
        self.client.post(self.url_lock)
        
        # Admin разблокирует
        self.client.force_authenticate(user=self.admin)
        response = self.client.post(self.url_unlock)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], 'unlocked')
    
    def test_unlock_item_forbidden_other_user(self):
        """❌ User2 пытается разблокировать ТМЦ User1"""
        # User1 блокирует
        self.client.force_authenticate(user=self.user1)
        self.client.post(self.url_lock)
        
        # User2 пытается разблокировать
        self.client.force_authenticate(user=self.user2)
        response = self.client.post(self.url_unlock)
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertIn('user1', response.data['error'])
    
    def test_unlock_not_locked_item(self):
        """✅ Разблокировка свободного ТМЦ"""
        self.client.force_authenticate(user=self.user1)
        response = self.client.post(self.url_unlock)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
    
    def test_lock_item_nonexistent(self):
        """❌ Блокировка несуществующего ТМЦ"""
        self.client.force_authenticate(user=self.user1)
        url = reverse('lock_item', kwargs={'item_id': 999})
        response = self.client.post(url)
        
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
    
    def test_lock_item_unauthenticated(self):
        """❌ Блокировка без авторизации"""
        response = self.client.post(self.url_lock)
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class ItemServiceTests(APITestCase):
    """Тесты для отправки ТМЦ в сервис (send_to_service)"""
    
    def setUp(self):
        """Создаём пользователей, бригады и ТМЦ"""
        self.user1 = User.objects.create_user(username='user1', password='pass')
        self.user2 = User.objects.create_user(username='user2', password='pass')
        
        self.brigade = Brigade.objects.create(
            name='Бригада 1',
            brigadier='Иванов',
            responsible='Петров'
        )
        
        self.item_free = Item.objects.create(
            name='Ноутбук Dell (свободный)',
            status='available',
            qty=1
        )
        
        self.item_brigade = Item.objects.create(
            name='Монитор LG (в бригаде)',
            status='at_work',
            brigade=self.brigade,
            qty=1
        )
    
    def test_send_to_service_free_item(self):
        """✅ Отправка свободного ТМЦ в сервис"""
        from .models import ItemHistory
        
        self.client.force_authenticate(user=self.user1)
        
        url = reverse('send_to_service', kwargs={'item_id': self.item_free.id})
        data = {'reason': 'Не включается'}
        
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], 'confirm_repair')
        
        # Проверяем БД
        item = Item.objects.get(id=self.item_free.id)
        self.assertEqual(item.status, 'confirm_repair')
        self.assertIsNone(item.brigade)
        
        # История
        history = ItemHistory.objects.filter(item=self.item_free).last()
        self.assertIn('Отправлено в сервис. Причина: Не включается', history.action)
        self.assertEqual(history.user, 'user1')
    
    def test_send_to_service_item_from_brigade(self):
        """✅ ТМЦ из бригады → сбрасываем привязку"""
        self.client.force_authenticate(user=self.user1)
        
        url = reverse('send_to_service', kwargs={'item_id': self.item_brigade.id})
        data = {'reason': 'Сломался экран'}
        
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], 'confirm_repair')
        self.assertIsNone(response.data.get('brigade'))
        
        # БД проверки
        item = Item.objects.get(id=self.item_brigade.id)
        self.assertEqual(item.status, 'confirm_repair')
        self.assertIsNone(item.brigade)  # ✅ Сброшена привязка!
    
    def test_send_to_service_no_reason(self):
        """✅ Без reason — пустая строка"""
        from .models import ItemHistory
        
        self.client.force_authenticate(user=self.user1)
        
        url = reverse('send_to_service', kwargs={'item_id': self.item_free.id})
        response = self.client.post(url, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        history = ItemHistory.objects.filter(item=self.item_free).last()
        self.assertIn('Отправлено в сервис. Причина:', history.action)
        self.assertIn('Ожидание подтверждения.', history.action)
    
    def test_send_to_service_unauthenticated(self):
        """❌ Без авторизации"""
        url = reverse('send_to_service', kwargs={'item_id': self.item_free.id})
        response = self.client.post(url, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    
    def test_send_to_service_nonexistent_item(self):
        """❌ Несуществующий ТМЦ"""
        self.client.force_authenticate(user=self.user1)
        
        url = reverse('send_to_service', kwargs={'item_id': 999})
        response = self.client.post(url, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
    
    def test_serializer_returns_full_item(self):
        """✅ Response содержит полные данные Item"""
        self.client.force_authenticate(user=self.user1)
        
        url = reverse('send_to_service', kwargs={'item_id': self.item_free.id})
        data = {'reason': 'Тест'}
        
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('id', response.data)
        self.assertIn('name', response.data)
        self.assertIn('status', response.data)
        self.assertEqual(response.data['status'], 'confirm_repair')
    
    def test_history_ordering(self):
        """✅ История сортируется по времени (новые сверху)"""
        from .models import ItemHistory
        
        self.client.force_authenticate(user=self.user1)
        
        url = reverse('send_to_service', kwargs={'item_id': self.item_free.id})
        self.client.post(url, {'reason': 'Первая отправка'})
        
        # Вторая отправка (повторно)
        self.client.post(url, {'reason': 'Вторая отправка'})
        
        history = ItemHistory.objects.filter(item=self.item_free).order_by('-timestamp')
        self.assertEqual(history.first().action, 'Отправлено в сервис. Причина: Вторая отправка. Ожидание подтверждения.')


class ItemReturnFromServiceTests(APITestCase):
    """Тесты для возврата ТМЦ из сервиса (return_from_service)"""
    
    def setUp(self):
        """Создаём пользователей и ТМЦ в разных статусах"""
        self.user1 = User.objects.create_user(username='user1', password='pass')
        self.user2 = User.objects.create_user(username='user2', password='pass')
        
        # ТМЦ в сервисе (confirm_repair)
        self.item_in_service = Item.objects.create(
            name='Ноутбук Dell (из сервиса)',
            status='confirm_repair',
            qty=1
        )
        
        # Другой ТМЦ для тестов
        self.item_available = Item.objects.create(
            name='Монитор LG (доступный)',
            status='available',
            qty=1
        )
    
    def test_return_from_service_success(self):
        """✅ Возврат из сервиса → available"""
        from .models import ItemHistory
        
        self.client.force_authenticate(user=self.user1)
        
        url = reverse('return_from_service', kwargs={'item_id': self.item_in_service.id})
        data = {'comment': 'Ремонт завершён, протестировано'}
        
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], 'available')
        
        # БД проверки
        item = Item.objects.get(id=self.item_in_service.id)
        self.assertEqual(item.status, 'available')
        
        # История
        history = ItemHistory.objects.filter(item=self.item_in_service).last()
        self.assertIn('Возвращено из сервиса. Комментарий: Ремонт завершён', history.action)
        self.assertEqual(history.user, 'user1')
    
    def test_return_from_service_no_comment(self):
        """✅ Без comment — пустая строка"""
        from .models import ItemHistory
        
        self.client.force_authenticate(user=self.user1)
        
        url = reverse('return_from_service', kwargs={'item_id': self.item_in_service.id})
        response = self.client.post(url, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        history = ItemHistory.objects.filter(item=self.item_in_service).last()
        self.assertIn('Возвращено из сервиса. Комментарий:', history.action)
    
    def test_return_from_service_already_available(self):
        """✅ Возврат уже доступного ТМЦ"""
        self.client.force_authenticate(user=self.user1)
        
        url = reverse('return_from_service', kwargs={'item_id': self.item_available.id})
        data = {'comment': 'Повторный возврат'}
        
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], 'available')
        
        item = Item.objects.get(id=self.item_available.id)
        self.assertEqual(item.status, 'available')
    
    def test_return_from_service_unauthenticated(self):
        """❌ Без авторизации"""
        url = reverse('return_from_service', kwargs={'item_id': self.item_in_service.id})
        response = self.client.post(url, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    
    def test_return_from_service_nonexistent_item(self):
        """❌ Несуществующий ТМЦ"""
        self.client.force_authenticate(user=self.user1)
        
        url = reverse('return_from_service', kwargs={'item_id': 999})
        response = self.client.post(url, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
    
    def test_serializer_returns_full_item(self):
        """✅ Response содержит полные данные Item"""
        self.client.force_authenticate(user=self.user1)
        
        url = reverse('return_from_service', kwargs={'item_id': self.item_in_service.id})
        data = {'comment': 'Тест'}
        
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('id', response.data)
        self.assertIn('name', response.data)
        self.assertIn('status', response.data)
        self.assertEqual(response.data['status'], 'available')
    
    def test_history_user_fallback(self):
        """✅ Username записывается в историю"""
        from .models import ItemHistory
        
        # Создаём пользователя pvn
        pvn_user = User.objects.create_user(username='pvn', password='pass')
        self.client.force_authenticate(user=pvn_user)
        
        url = reverse('return_from_service', kwargs={'item_id': self.item_in_service.id})
        self.client.post(url, format='json')
        
        history = ItemHistory.objects.filter(item=self.item_in_service).last()
        self.assertEqual(history.user, 'pvn')
    
    def test_multiple_returns_ordering(self):
        """✅ История сортируется правильно"""
        from .models import ItemHistory
        
        self.client.force_authenticate(user=self.user1)
        
        # Первая запись
        self.client.post(
            reverse('return_from_service', kwargs={'item_id': self.item_in_service.id}), 
            {'comment': 'Первая запись'}
        )
        
        # Вторая запись
        self.client.post(
            reverse('return_from_service', kwargs={'item_id': self.item_in_service.id}), 
            {'comment': 'Вторая запись'}
        )
        
        history = list(ItemHistory.objects.filter(item=self.item_in_service).order_by('-timestamp'))
        self.assertEqual(history[0].action, 'Возвращено из сервиса. Комментарий: Вторая запись')
        self.assertEqual(history[1].action, 'Возвращено из сервиса. Комментарий: Первая запись')


class ItemConfirmRepairTests(APITestCase):
    """Тесты для подтверждения ремонта (confirm_repair)"""
    
    def setUp(self):
        """Создаём пользователей и ТМЦ"""
        self.user1 = User.objects.create_user(username='user1', password='pass')
        self.user2 = User.objects.create_user(username='user2', password='pass')
        
        # ТМЦ в статусе confirm_repair (типично перед подтверждением)
        self.item_confirm_repair = Item.objects.create(
            name='Ноутбук Dell (подтверждение ремонта)',
            status='confirm_repair',
            qty=1
        )
        
        # Другой ТМЦ для тестов
        self.item_available = Item.objects.create(
            name='Монитор LG (доступный)',
            status='available',
            qty=1
        )
    
    def test_confirm_repair_success(self):
        """✅ Подтверждение ремонта → in_repair"""
        from .models import ItemHistory
        
        self.client.force_authenticate(user=self.user1)
        
        url = reverse('confirm_repair', kwargs={'item_id': self.item_confirm_repair.id})
        data = {
            'invoice_number': 'INV-2026-001',
            'location': 'Сервисный центр №1'
        }
        
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], 'in_repair')
        
        # БД проверки
        item = Item.objects.get(id=self.item_confirm_repair.id)
        self.assertEqual(item.status, 'in_repair')
        
        # История
        history = ItemHistory.objects.filter(item=self.item_confirm_repair).last()
        expected_action = "Ремонт ТМЦ согласован — № счета INV-2026-001. Локация: Сервисный центр №1"
        self.assertEqual(history.action, expected_action)
        self.assertEqual(history.user, 'user1')
    
    def test_confirm_repair_default_values(self):
        """✅ Без параметров — дефолтные значения"""
        from .models import ItemHistory
        
        self.client.force_authenticate(user=self.user1)
        
        url = reverse('confirm_repair', kwargs={'item_id': self.item_confirm_repair.id})
        response = self.client.post(url, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], 'in_repair')
        
        history = ItemHistory.objects.filter(item=self.item_confirm_repair).last()
        expected_action = "Ремонт ТМЦ согласован — № счета Не указан. Локация: Не указана"
        self.assertEqual(history.action, expected_action)
    
    def test_confirm_repair_any_status(self):
        """✅ Работает с любым статусом (available → in_repair)"""
        self.client.force_authenticate(user=self.user1)
        
        url = reverse('confirm_repair', kwargs={'item_id': self.item_available.id})
        data = {'invoice_number': 'INV-001', 'location': 'Мастерская'}
        
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], 'in_repair')
        
        item = Item.objects.get(id=self.item_available.id)
        self.assertEqual(item.status, 'in_repair')
    
    def test_confirm_repair_unauthenticated(self):
        """❌ Без авторизации"""
        url = reverse('confirm_repair', kwargs={'item_id': self.item_confirm_repair.id})
        response = self.client.post(url, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    
    def test_confirm_repair_nonexistent_item(self):
        """❌ Несуществующий ТМЦ"""
        self.client.force_authenticate(user=self.user1)
        
        url = reverse('confirm_repair', kwargs={'item_id': 999})
        response = self.client.post(url, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
    
    def test_serializer_returns_full_item(self):
        """✅ Response содержит полные данные Item"""
        self.client.force_authenticate(user=self.user1)
        
        url = reverse('confirm_repair', kwargs={'item_id': self.item_confirm_repair.id})
        data = {'invoice_number': 'TEST-123', 'location': 'Тест'}
        
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('id', response.data)
        self.assertIn('name', response.data)
        self.assertIn('status', response.data)
        self.assertEqual(response.data['status'], 'in_repair')
    
    def test_history_user_records_username(self):
        """✅ Username записывается в историю"""
        from .models import ItemHistory
        
        pvn_user = User.objects.create_user(username='pvn', password='pass')
        self.client.force_authenticate(user=pvn_user)
        
        url = reverse('confirm_repair', kwargs={'item_id': self.item_confirm_repair.id})
        self.client.post(url, format='json')
        
        history = ItemHistory.objects.filter(item=self.item_confirm_repair).last()
        self.assertEqual(history.user, 'pvn')
    
    def test_multiple_confirmations_ordering(self):
        """✅ История сортируется правильно (новые сверху)"""
        from .models import ItemHistory
        
        self.client.force_authenticate(user=self.user1)
        
        # Первое подтверждение
        self.client.post(
            reverse('confirm_repair', kwargs={'item_id': self.item_confirm_repair.id}), 
            {'invoice_number': 'INV-001'}
        )
        
        # Второе подтверждение
        self.client.post(
            reverse('confirm_repair', kwargs={'item_id': self.item_confirm_repair.id}), 
            {'invoice_number': 'INV-002'}
        )
        
        history = list(ItemHistory.objects.filter(item=self.item_confirm_repair).order_by('-timestamp'))
        self.assertIn('INV-002', history[0].action)
        self.assertIn('INV-001', history[1].action)
