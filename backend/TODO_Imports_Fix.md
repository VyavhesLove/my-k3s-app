# TODO: Исправление импортов в services/

## Исправления:

### 1. history_service.py ✓
- [x] Исправить `from .models import` → `from ..models import`
- [x] Добавить метод `repair_confirmed()`
- [x] Добавить метод `unlocked()`
- [x] Добавить метод `confirmed()`

### 2. lock_service.py ✓
- [x] Исправить `from ..models import Item` → `from items.models import Item`

### 3. history_actions.py (domain/) ✓
- [x] Исправить `from ...enums import` → `from items.enums import`

### 4. Команды (commands/) ✓
- [x] confirm_item.py - исправлены импорты
- [x] confirm_tmc.py - исправлены импорты
- [x] send_to_service.py - исправлены импорты
- [x] return_from_service.py - исправлены импорты
- [x] update_item.py - исправлены импорты

### 5. Запросы (queries/) ✓
- [x] list_items.py - исправлены импорты
- [x] get_status_counters.py - исправлены импорты
- [x] get_analytics.py - исправлены импорты
- [x] get_item.py - исправлены импорты
- [x] get_item_history.py - исправлены импорты
- [x] list_items_for_confirm.py - исправлены импорты

### 6. Тестирование ✓
- [x] Проверка синтаксиса: Успешно

