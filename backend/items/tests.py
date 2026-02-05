from django.urls import reverse
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from django.contrib.auth.models import User
from rest_framework.settings import api_settings
from rest_framework.permissions import AllowAny
from .models import Brigade, Item, Location

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
