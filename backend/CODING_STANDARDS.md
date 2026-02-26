# Стандарты разработки Backend

## 1. Использование Enum для статусов

### Всегда используйте `ItemStatus` enum вместо магических строк

**❌ Неправильно:**
```python
item.status = 'issued'
if item.status == 'confirm':
    ...
```

**✅ Правильно:**
```python
from .enums import ItemStatus

item.status = ItemStatus.ISSUED
if item.status == ItemStatus.CONFIRM:
    ...
```

### Где определены статусы

Все статусы ТМЦ определены в `items/enums.py`:

```python
class ItemStatus(models.TextChoices):
    AT_WORK = "at_work", "В работе"
    IN_REPAIR = "in_repair", "В ремонте"
    ISSUED = "issued", "Выдано"
    AVAILABLE = "available", "Доступно"
    CONFIRM = "confirm", "Требует подтверждения"
    CONFIRM_REPAIR = "confirm_repair", "Подтвердить ремонт"
```

### Почему это важно

1. **Type safety** - компилятор/IDE подскажет ошибки
2. **Centralized** - все статусы в одном месте
3. **Autocomplete** - IDE подскажет доступные статусы
4. **Refactoring** - легко находить использования статусов
5. **Validation** - невозможно опечататься в статусе

---

## 2. Где размещать бизнес-логику

### Обязательное разделение слоёв

#### views/ — только HTTP-слой:
- permissions
- валидация входа через serializer
- вызов command/query
- формирование HTTP-ответа

#### services/commands/ — любые изменения состояния (write-операции)

#### services/queries/ — read-only операции

#### services/domain/ — доменные проверки/правила переходов

**Запрещено:** помещать бизнес-логику в DRF views.

---

## 3. Конкурентность и атомарность (АКТУАЛЬНО)

### Для write-операций

В commands используем транзакционный подход:

```python
@transaction.atomic
def my_command(item_id, user, **kwargs):
    # 1. Чтение сущности с блокировкой
    item = Item.objects.select_for_update().get(id=item_id)
    
    # 2. Валидация переходов
    if item.status != ItemStatus.CONFIRM:
        raise ValueError("ТМЦ не требует подтверждения")
    
    # 3. Изменение полей + сохранение
    item.status = ItemStatus.ISSUED
    item.save()
    
    # 4. Запись истории через HistoryService
    HistoryService.add_action(
        item=item,
        action=HistoryAction.ITEM_ISSUED,
        user=user
    )
```

**Важно:**
- В commands не использовать `LockService.lock()`/`unlock()`.
- Ручной unlock в commands не нужен: row-lock снимается автоматически при завершении транзакции.

### Роль LockService

`LockService` допускается только в UI-oriented сценариях (например, временная блокировка из views для модалок/подсказок), но не как основной механизм консистентности бизнес-логики.

---

## 4. История изменений

Все изменения состояния должны сопровождаться записью в историю через `HistoryService`.

Для типовых событий используйте `HistoryAction.*.build(...)` (через `HistoryService`), а не ad-hoc строки.

Для смены статуса обязательно добавляйте событие `status_changed`.

---

## 5. Единый формат API-ответов

Для API придерживаемся стандарта:

**Успех:**
```json
{"success": true, "data": ...}
```

**Ошибка:**
```json
{"success": false, "error": "..."}
```

Ошибки домена должны маппиться на корректные HTTP-коды:
- validation → 400
- conflict → 409
- not found → 404

---

## 6. Направление зависимостей (clean architecture)

Соблюдайте строгую направленность:

```
views → commands → domain/enums → models
```

**Дополнительно:**
- commands не импортируют views
- domain не импортирует services
- enums не импортируют models

**HistoryService** может зависеть от models, но **domain** — никогда.

---

## 7. Пользовательская модель

**Никогда** не импортируйте `User` из `django.contrib.auth.models` в новом коде.

Используйте `settings.AUTH_USER_MODEL` / `get_user_model()`.

**✅ Правильно:**
```python
from django.conf import settings
from django.contrib.auth import get_user_model

User = get_user_model()
# или
class MyModel(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, ...)
```

**❌ Неправильно:**
```python
from django.contrib.auth.models import User
```

---

## 8. Модель UserSession и импорты из models_session.py

Модель `UserSession` находится в отдельном файле `users/models_session.py`. Это Special case - модель вынесена в отдельный файл для избежания циклических импортов.

**Всегда проверяйте импорт UserSession при работе с функциями:**
- `get_current_user()`
- `get_active_sessions()`
- `terminate_session()`
- `create_session()`

**✅ Правильно:**
```python
from users.models_session import UserSession

def get_active_sessions(user):
    return UserSession.objects.filter(user=user, is_active=True)
```

**❌ Неправильно (вызовет NameError и 500 ошибку):**
```python
# Забыли импорт - будет ошибка при вызове функции
def get_active_sessions(user):
    return UserSession.objects.filter(user=user, is_active=True)
```

### Тест для проверки импорта UserSession

Для быстрого выявления проблем с импортом запустите тест:

```bash
cd my-k3s-app/backend
source venv/bin/activate
pytest tests/test_imports/test_user_session_import.py -v
```

Тест находится в: `tests/test_imports/test_user_session_import.py`

---

## 10. Frontend-интеграция

При работе с фронтендом:

- Использовать единый экземпляр axios (с baseURL и interceptor-ами)
- При инициализации данных загружать их только при наличии токена
- Проверять структуру ответа API и безопасно обрабатывать отсутствие ожидаемых полей

---

## 11. Структура сервисов

### Новый сервис должен следовать паттерну

```python
class MyService:
    @staticmethod
    @transaction.atomic
    def do_something(item_id, user, **kwargs):
        """
        Описание метода.
        @transaction.atomic - ОБЯЗАТЕЛЬНО для операций с БД.
        """
        # 1. Блокируем
        item = ItemLockService.lock_item(item_id, user)
        
        try:
            # 2. Валидация
            if item.status != ItemStatus.CONFIRM:
                raise ValueError("ТМЦ не требует подтверждения")
            
            # 3. Логика
            item.status = ItemStatus.ISSUED
            item.save()
            
            # 4. История
            ItemHistory.objects.create(
                item=item,
                action="Действие выполнено",
                user=user.username
            )
            
        finally:
            # 5. Разблокировка
            ItemLockService.unlock_item(item_id, user)
```

---

## 12. Чек-лист перед коммитом

- [ ] Все статусы используют `ItemStatus` enum
- [ ] Все операции записи используют `ItemLockService`
- [ ] Все сервисы с БД операциями имеют `@transaction.atomic`
- [ ] Всегда есть `try/finally` для разблокировки
- [ ] Тесты покрывают новую функциональность

---

## Примеры API вьюх

См. `items/views.py` для примеров правильного использования:
- `send_to_service()` - отправка в ремонт
- `return_from_service()` - возврат из ремонта  
- `confirm_repair()` - подтверждение ремонта
- `confirm_item()` - подтверждение ТМЦ
- `update_item()` - обновление с блокировкой

### Что в итоге ОСТАЁТСЯ во views

После рефакторинга views.py:

**ОСТАЁТСЯ:**
- routing
- permissions
- serializers (input/output)
- HTTP-ответы

**НЕ ДОЛЖНО БЫТЬ:**
- бизнес-логики
- истории
- блокировок
- смены статусов

---

## 13. Справочник для ИИ-агента

### Структура проекта

```
backend/
├── items/
│   ├── enums.py           # ItemStatus, HistoryAction, HistoryActionTemplates
│   ├── models.py           # Item, ItemHistory, Location, Brigade, WriteOffRecord
│   ├── serializers.py      # DRF serializers для ввода/вывода
│   ├── views/              # HTTP-слой (только роутинг, permissions, ответы)
│   │   ├── items.py        # CRUD операции
│   │   ├── confirm_tmc.py  # Подтверждение ТМЦ
│   │   ├── history.py      # История
│   │   ├── locks.py        # Блокировки
│   │   ├── services.py     # Сервисные операции
│   │   └── writeoffs.py    # Списание ТМЦ
│   ├── services/
│   │   ├── commands/       # Write-операции (изменяют состояние)
│   │   │   ├── confirm_item.py
│   │   │   ├── send_to_service.py
│   │   │   ├── return_from_service.py
│   │   │   ├── write_off.py
│   │   │   └── cancel_write_off.py
│   │   ├── queries/        # Read-операции
│   │   │   ├── get_item.py
│   │   │   ├── list_items.py
│   │   │   └── get_item_history.py
│   │   ├── domain/
│   │   │   ├── exceptions.py  # DomainValidationError, DomainConflictError, DomainNotFoundError
│   │   │   └── item_transitions.py
│   │   ├── history_service.py
│   │   └── lock_service.py
│   ├── utils.py            # api_response(), api_error()
│   ├── exceptions.py      # custom_exception_handler
│   └── permissions.py      # DRF permissions
```

### Ключевые импорты

```python
# Модели
from items.models import Item, ItemHistory, Location, Brigade, WriteOffRecord

# Enums
from items.enums import ItemStatus, HistoryAction

# Доменные исключения
from items.services.domain.exceptions import DomainValidationError, DomainConflictError, DomainNotFoundError

# Утилиты API
from items.utils import api_response, api_error

# Queries
from items.services.queries import GetItemQuery, ListItemsQuery

# Commands
from items.services.commands import UpdateItemCommand, ConfirmItemCommand

# HistoryService
from items.services.history_service import HistoryService
```

### Паттерны команд и запросов

#### Command (пишет данные):
```python
from items.services.commands import ConfirmItemCommand
from items.services.domain.exceptions import DomainValidationError, DomainConflictError, DomainNotFoundError

@transaction.atomic
def execute(item_id, user, **kwargs):
    item = Item.objects.select_for_update().get(id=item_id)
    # валидация
    if item.status != ItemStatus.CONFIRM:
        raise DomainValidationError("Невозможно подтвердить ТМЦ")
    # изменение
    item.status = ItemStatus.AVAILABLE
    item.save()
    # история
    HistoryService.confirmed(item=item, user=user)
    return item.id
```

#### Query (читает данные):
```python
from items.services.queries import GetItemQuery, ListItemsQuery

item = GetItemByIdQuery.execute(item_id)
items = ListItemsQuery.all(search_query)
```

### Работа с историей

```python
from items.services.history_service import HistoryService
from items.enums import HistoryAction

# Используй семантические методы:
HistoryService.confirmed(item, user, comment="ok")
HistoryService.sent_to_service(item, user, reason="поломка")
HistoryService.status_changed(item, user, old_status, new_status)
HistoryService.written_off(item, user, reason="износ", amount=Decimal("1000"))

# Или generic метод:
HistoryService.create(item, action_type, user=user, payload={...})
```

### Формат API-ответов

```python
# Успех
return api_response(data={...})
return api_response(data={...}, message="Создано", status_code=201)

# Ошибка
return api_error("Текст ошибки", 404)
raise DomainValidationError("Ошибка валидации")  # автоматически 400
raise DomainConflictError("Конфликт")            # автоматически 409
raise DomainNotFoundError("Не найдено")          # автоматически 404
```

### Важные правила

1. **Всегда используй enums** — `ItemStatus`, `HistoryAction`
2. **Commands через transaction.atomic + select_for_update()** — НЕ LockService
3. **Пиши историю** — все изменения через HistoryService
4. **Не импортируй User из django.contrib.auth** — используй settings.AUTH_USER_MODEL
5. **Доменные исключения не знают про HTTP** — маппинг в exceptions.py
6. **Views только для HTTP** — логика в commands/queries

### Запуск тестов

```bash
cd my-k3s-app/backend
source venv/bin/activate
pytest
```

