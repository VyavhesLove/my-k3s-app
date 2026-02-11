"""Тесты для Query-классов items-сервисов.

Queries — самый простой способ поднять coverage.
Создаём объекты, вызываем query-сервис, проверяем результат.
"""
from django.test import TestCase
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta

from items.models import Item, ItemHistory, Location, Brigade
from items.enums import ItemStatus

from items.services.queries.list_items import ListItemsQuery
from items.services.queries.get_item import GetItemQuery
from items.services.queries.get_item_history import GetItemHistoryQuery
from items.services.queries.get_status_counters import GetStatusCountersQuery
from items.services.queries.get_analytics import GetAnalyticsQuery
from items.services.queries.list_items_for_confirm import ListItemsForConfirmQuery

User = get_user_model()


class ListItemsQueryTestCase(TestCase):
    """Тесты для ListItemsQuery."""

    def setUp(self):
        """Создаём тестовые данные."""
        self.item1 = Item.objects.create(
            name="Laptop Dell",
            brand="Dell",
            status=ItemStatus.AVAILABLE,
            location="Main warehouse",
        )
        self.item2 = Item.objects.create(
            name="Laptop HP",
            brand="HP",
            status=ItemStatus.ISSUED,
            location="Second warehouse",
        )
        self.item3 = Item.objects.create(
            name="Monitor Samsung",
            brand="Samsung",
            status=ItemStatus.AVAILABLE,
            location="Main warehouse",
        )

    def test_list_all_returns_all_items(self):
        """ListItemsQuery.all() возвращает все ТМЦ."""
        result = list(ListItemsQuery.all())
        self.assertEqual(len(result), 3)

    def test_list_all_order_by_id_desc(self):
        """ListItemsQuery.all() сортирует по ID desc."""
        result = list(ListItemsQuery.all())
        self.assertEqual(result[0].id, self.item3.id)
        self.assertEqual(result[1].id, self.item2.id)
        self.assertEqual(result[2].id, self.item1.id)

    def test_list_all_with_search_by_name(self):
        """ListItemsQuery.all() ищет по названию."""
        result = list(ListItemsQuery.all(search_query="Dell"))
        self.assertEqual(len(result), 1)
        self.assertEqual(result[0].name, "Laptop Dell")

    def test_list_all_with_search_by_partial_name(self):
        """ListItemsQuery.all() ищет по части названия."""
        result = list(ListItemsQuery.all(search_query="Laptop"))
        self.assertEqual(len(result), 2)

    def test_list_all_with_search_by_status(self):
        """ListItemsQuery.all() ищет по статусу."""
        result = list(ListItemsQuery.all(search_query=ItemStatus.AVAILABLE))
        self.assertEqual(len(result), 2)

    def test_list_all_with_no_match_search(self):
        """ListItemsQuery.all() ничего не возвращает при неудачном поиске."""
        result = list(ListItemsQuery.all(search_query="NonExistent"))
        self.assertEqual(len(result), 0)

    def test_list_with_details_returns_all_items(self):
        """ListItemsQuery.with_details() возвращает все ТМЦ."""
        result = list(ListItemsQuery.with_details())
        self.assertEqual(len(result), 3)

    def test_list_with_details_includes_brigade(self):
        """ListItemsQuery.with_details() подгружает brigade."""
        # Создаём бригаду и связываем с item
        brigade = Brigade.objects.create(
            name="Brigade 1",
            brigadier="Ivan Ivanov",
            responsible="Petrov"
        )
        self.item1.brigade = brigade
        self.item1.save()

        result = list(ListItemsQuery.with_details())
        
        # Находим item с brigade
        item_with_brigade = next((item for item in result if item.brigade is not None), None)
        self.assertIsNotNone(item_with_brigade)
        self.assertEqual(item_with_brigade.brigade.name, "Brigade 1")

    def test_list_with_details_with_search(self):
        """ListItemsQuery.with_details() с поиском."""
        result = list(ListItemsQuery.with_details(search_query="Samsung"))
        self.assertEqual(len(result), 1)
        self.assertEqual(result[0].name, "Monitor Samsung")


class GetItemQueryTestCase(TestCase):
    """Тесты для GetItemQuery."""

    def setUp(self):
        """Создаём тестовые данные."""
        self.item = Item.objects.create(
            name="Test Item",
            brand="Test Brand",
            status=ItemStatus.AVAILABLE,
            location="Test Location",
            serial="SN12345",
        )

    def test_get_by_id_existing(self):
        """GetItemQuery.by_id() возвращает существующий item."""
        result = GetItemQuery.by_id(self.item.id)
        self.assertIsNotNone(result)
        self.assertEqual(result.name, "Test Item")

    def test_get_by_id_not_found(self):
        """GetItemQuery.by_id() возвращает None для несуществующего."""
        result = GetItemQuery.by_id(99999)
        self.assertIsNone(result)

    def test_get_by_id_with_brigade(self):
        """GetItemQuery.by_id() подгружает brigade."""
        brigade = Brigade.objects.create(
            name="Test Brigade",
            brigadier="Brigadier",
            responsible="Responsible"
        )
        self.item.brigade = brigade
        self.item.save()

        result = GetItemQuery.by_id(self.item.id)
        self.assertIsNotNone(result)
        self.assertEqual(result.brigade.name, "Test Brigade")

    def test_get_with_details_existing(self):
        """GetItemQuery.with_details() возвращает существующий item."""
        result = GetItemQuery.with_details(self.item.id)
        self.assertIsNotNone(result)
        self.assertEqual(result.name, "Test Item")

    def test_get_with_details_not_found(self):
        """GetItemQuery.with_details() возвращает None для несуществующего."""
        result = GetItemQuery.with_details(99999)
        self.assertIsNone(result)

    def test_get_with_details_prefetches_history(self):
        """GetItemQuery.with_details() prefetch-ит историю."""
        # Создаём историю
        user = User.objects.create_user(username="testuser", password="123")
        ItemHistory.objects.create(
            item=self.item,
            action="Test action",
            user=user,
        )

        result = GetItemQuery.with_details(self.item.id)
        # history должна быть уже загружена (lazy loading не вызовет доп. запросов)
        history_list = list(result.history.all())
        self.assertEqual(len(history_list), 1)


class GetItemHistoryQueryTestCase(TestCase):
    """Тесты для GetItemHistoryQuery."""

    def setUp(self):
        """Создаём тестовые данные."""
        self.user = User.objects.create_user(username="testuser", password="123")
        self.location = Location.objects.create(name="Test Location")
        
        self.item = Item.objects.create(
            name="Test Item",
            status=ItemStatus.AVAILABLE,
        )
        
        # Создаём несколько записей истории
        self.history1 = ItemHistory.objects.create(
            item=self.item,
            action="Action 1",
            action_type="created",
            user=self.user,
            location=self.location,
        )
        self.history2 = ItemHistory.objects.create(
            item=self.item,
            action="Action 2",
            action_type="updated",
            user=self.user,
            location=self.location,
        )

    def test_get_all_history(self):
        """GetItemHistoryQuery.all() возвращает всю историю."""
        result = list(GetItemHistoryQuery.all(self.item.id))
        self.assertEqual(len(result), 2)

    def test_get_all_history_order_by_timestamp_desc(self):
        """GetItemHistoryQuery.all() сортирует по timestamp desc."""
        result = list(GetItemHistoryQuery.all(self.item.id))
        self.assertEqual(result[0].action, "Action 2")
        self.assertEqual(result[1].action, "Action 1")

    def test_get_all_history_with_limit(self):
        """GetItemHistoryQuery.all() с limit."""
        result = list(GetItemHistoryQuery.all(self.item.id, limit=1))
        self.assertEqual(len(result), 1)

    def test_get_all_history_selects_related(self):
        """GetItemHistoryQuery.all() подгружает user и location."""
        # Просто проверяем что запрос выполняется без ошибок
        result = GetItemHistoryQuery.all(self.item.id)
        # Доступ к связанным полям не должно вызывать доп. запросов
        self.assertIsNotNone(result[0].user)
        self.assertIsNotNone(result[0].location)

    def test_get_recent_history(self):
        """GetItemHistoryQuery.recent() возвращает историю за период."""
        # История за последние 30 дней должна быть
        result = list(GetItemHistoryQuery.recent(self.item.id, days=30))
        self.assertEqual(len(result), 2)

    def test_get_recent_history_old_data_excluded(self):
        """GetItemHistoryQuery.recent() исключает старую историю."""
        # Создаём старую запись
        old_history = ItemHistory.objects.create(
            item=self.item,
            action="Old action",
            action_type="old",
            user=self.user,
        )
        # Меняем timestamp на старую дату
        old_history.timestamp = timezone.now() - timedelta(days=60)
        old_history.save()

        result = list(GetItemHistoryQuery.recent(self.item.id, days=30))
        # Старая запись не должна попасть в результат
        self.assertEqual(len(result), 2)

    def test_get_history_with_action_pattern(self):
        """GetItemHistoryQuery.with_action() фильтрует по паттерну."""
        result = list(GetItemHistoryQuery.with_action(self.item.id, "Action 1"))
        self.assertEqual(len(result), 1)
        self.assertEqual(result[0].action, "Action 1")

    def test_get_history_with_partial_action_pattern(self):
        """GetItemHistoryQuery.with_action() ищет по частичному совпадению."""
        result = list(GetItemHistoryQuery.with_action(self.item.id, "Action"))
        self.assertEqual(len(result), 2)


class GetStatusCountersQueryTestCase(TestCase):
    """Тесты для GetStatusCountersQuery."""

    def setUp(self):
        """Создаём тестовые данные с разными статусами."""
        Item.objects.create(name="Item 1", status=ItemStatus.AVAILABLE)
        Item.objects.create(name="Item 2", status=ItemStatus.AVAILABLE)
        Item.objects.create(name="Item 3", status=ItemStatus.ISSUED)
        Item.objects.create(name="Item 4", status=ItemStatus.CONFIRM)
        Item.objects.create(name="Item 5", status=ItemStatus.CONFIRM)
        Item.objects.create(name="Item 6", status=ItemStatus.CONFIRM)
        Item.objects.create(name="Item 7", status=ItemStatus.AT_WORK)

    def test_all_returns_status_counts(self):
        """GetStatusCountersQuery.all() возвращает словарь статусов."""
        result = GetStatusCountersQuery.all()
        
        self.assertEqual(result.get(ItemStatus.AVAILABLE), 2)
        self.assertEqual(result.get(ItemStatus.ISSUED), 1)
        self.assertEqual(result.get(ItemStatus.CONFIRM), 3)
        self.assertEqual(result.get(ItemStatus.AT_WORK), 1)

    def test_all_handles_empty_database(self):
        """GetStatusCountersQuery.all() работает с пустой БД."""
        # Удаляем все созданные items из setUp
        Item.objects.all().delete()
        
        result = GetStatusCountersQuery.all()
        self.assertEqual(len(result), 0)

    def test_summary_returns_correct_totals(self):
        """GetStatusCountersQuery.summary() возвращает правильную сводку."""
        result = GetStatusCountersQuery.summary()
        
        self.assertEqual(result["to_receive"], 3)  # CONFIRM
        self.assertEqual(result["to_repair"], 0)  # CONFIRM_REPAIR
        self.assertEqual(result["issued"], 2)  # ISSUED + AT_WORK

    def test_summary_with_confirm_repair(self):
        """GetStatusCountersQuery.summary() считает CONFIRM_REPAIR."""
        Item.objects.create(name="Item 8", status=ItemStatus.CONFIRM_REPAIR)
        
        result = GetStatusCountersQuery.summary()
        self.assertEqual(result["to_repair"], 1)

    def test_summary_zero_values(self):
        """GetStatusCountersQuery.summary() возвращает 0 для отсутствующих статусов."""
        # Удаляем все item
        Item.objects.all().delete()
        
        result = GetStatusCountersQuery.summary()
        self.assertEqual(result["to_receive"], 0)
        self.assertEqual(result["to_repair"], 0)
        self.assertEqual(result["issued"], 0)


class GetAnalyticsQueryTestCase(TestCase):
    """Тесты для GetAnalyticsQuery."""

    def setUp(self):
        """Создаём тестовые данные."""
        Item.objects.create(name="Laptop 1", brand="Dell", location="Warehouse 1", status=ItemStatus.AVAILABLE)
        Item.objects.create(name="Laptop 2", brand="Dell", location="Warehouse 1", status=ItemStatus.ISSUED)
        Item.objects.create(name="Laptop 3", brand="HP", location="Warehouse 2", status=ItemStatus.AVAILABLE)
        Item.objects.create(name="Monitor 1", brand="Samsung", location="Warehouse 1", status=ItemStatus.AVAILABLE)
        Item.objects.create(name="Monitor 2", brand="Samsung", location=None, status=ItemStatus.ISSUED)

    def test_all_returns_complete_analytics(self):
        """GetAnalyticsQuery.all() возвращает полную аналитику."""
        result = GetAnalyticsQuery.all()
        
        self.assertIn("by_brand", result)
        self.assertIn("by_location", result)
        self.assertIn("by_status", result)
        self.assertIn("details", result)

    def test_filtered_by_name(self):
        """GetAnalyticsQuery.filtered() фильтрует по названию."""
        result = GetAnalyticsQuery.filtered(name="Laptop")
        
        self.assertEqual(result["details"].count(), 3)

    def test_filtered_by_brand(self):
        """GetAnalyticsQuery.filtered() фильтрует по бренду."""
        result = GetAnalyticsQuery.filtered(brand="Dell")
        
        self.assertEqual(result["details"].count(), 2)

    def test_filtered_by_location(self):
        """GetAnalyticsQuery.filtered() фильтрует по локации."""
        result = GetAnalyticsQuery.filtered(location="Warehouse 1")
        
        self.assertEqual(result["details"].count(), 3)

    def test_filtered_combines_filters(self):
        """GetAnalyticsQuery.filtered() комбинирует фильтры."""
        result = GetAnalyticsQuery.filtered(brand="Dell", location="Warehouse 1")
        
        self.assertEqual(result["details"].count(), 2)

    def test_analytics_by_brand_sorted_by_count(self):
        """Аналитика по брендам отсортирована по количеству."""
        result = GetAnalyticsQuery.all()
        
        brands = result["by_brand"]
        self.assertEqual(len(brands), 3)
        # Проверяем что бренды отсортированы по убыванию
        self.assertGreaterEqual(brands[0]["value"], brands[1]["value"])
        self.assertGreaterEqual(brands[1]["value"], brands[2]["value"])

    def test_analytics_by_location_handles_null(self):
        """Аналитика по локациям обрабатывает null значения."""
        result = GetAnalyticsQuery.all()
        
        locations = result["by_location"]
        # Ищем "Не указана" для null локации
        location_names = [loc["location"] for loc in locations]
        self.assertIn("Не указана", location_names)

    def test_analytics_by_brand_handles_null_brand(self):
        """Аналитика по брендам обрабатывает null значения."""
        Item.objects.create(name="Item without brand", status=ItemStatus.AVAILABLE)
        
        result = GetAnalyticsQuery.all()
        brands = result["by_brand"]
        brand_names = [b["brand"] for b in brands]
        self.assertIn("Не указан", brand_names)

    def test_analytics_details_order_by_id_desc(self):
        """details отсортированы по ID desc."""
        result = GetAnalyticsQuery.all()
        
        details = list(result["details"])
        # ID должны быть по убыванию
        self.assertGreaterEqual(details[0].id, details[-1].id)


class ListItemsForConfirmQueryTestCase(TestCase):
    """Тесты для ListItemsForConfirmQuery."""

    def setUp(self):
        """Создаём тестовые данные."""
        self.brigade = Brigade.objects.create(
            name="Brigade 1",
            brigadier="Ivan",
            responsible="Petrov"
        )
        
        # ТМЦ требующие подтверждения
        self.item1 = Item.objects.create(
            name="Item 1",
            status=ItemStatus.CONFIRM,
            location="Warehouse A",
            brigade=self.brigade,
        )
        self.item2 = Item.objects.create(
            name="Item 2",
            status=ItemStatus.CONFIRM,
            location="Warehouse B",
        )
        
        # ТМЦ не требующие подтверждения
        Item.objects.create(name="Item 3", status=ItemStatus.AVAILABLE)
        Item.objects.create(name="Item 4", status=ItemStatus.ISSUED)

    def test_all_returns_only_confirm_status(self):
        """ListItemsForConfirmQuery.all() возвращает только CONFIRM."""
        result = list(ListItemsForConfirmQuery.all())
        
        self.assertEqual(len(result), 2)
        for item in result:
            self.assertEqual(item.status, ItemStatus.CONFIRM)

    def test_all_orders_by_id_desc(self):
        """ListItemsForConfirmQuery.all() сортирует по ID desc."""
        result = list(ListItemsForConfirmQuery.all())
        
        self.assertEqual(result[0].id, self.item2.id)
        self.assertEqual(result[1].id, self.item1.id)

    def test_all_includes_brigade(self):
        """ListItemsForConfirmQuery.all() подгружает brigade."""
        result = list(ListItemsForConfirmQuery.all())
        
        # Находим item с brigade
        item_with_brigade = next((item for item in result if item.brigade is not None), None)
        self.assertIsNotNone(item_with_brigade)
        self.assertEqual(item_with_brigade.brigade.name, "Brigade 1")

    def test_by_location_filters_by_location(self):
        """ListItemsForConfirmQuery.by_location() фильтрует по локации."""
        result = list(ListItemsForConfirmQuery.by_location("Warehouse A"))
        
        self.assertEqual(len(result), 1)
        self.assertEqual(result[0].name, "Item 1")

    def test_by_location_no_match(self):
        """ListItemsForConfirmQuery.by_location() ничего не возвращает при несовпадении."""
        result = list(ListItemsForConfirmQuery.by_location("NonExistent"))
        
        self.assertEqual(len(result), 0)

    def test_count_returns_correct_number(self):
        """ListItemsForConfirmQuery.count() возвращает правильное количество."""
        count = ListItemsForConfirmQuery.count()
        
        self.assertEqual(count, 2)

    def test_count_returns_zero_when_no_confirm_items(self):
        """ListItemsForConfirmQuery.count() возвращает 0 если нет CONFIRM."""
        Item.objects.filter(status=ItemStatus.CONFIRM).delete()
        
        count = ListItemsForConfirmQuery.count()
        self.assertEqual(count, 0)

    def test_empty_database(self):
        """Тест с пустой базой данных."""
        Item.objects.all().delete()
        
        result = list(ListItemsForConfirmQuery.all())
        self.assertEqual(len(result), 0)
        
        count = ListItemsForConfirmQuery.count()
        self.assertEqual(count, 0)

