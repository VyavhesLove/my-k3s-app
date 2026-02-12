# AUDIT Документация проекта my-k3s-app

> Дата генерации: 2025
> Версия: 1.0

---

## 1. СТАТУСЫ ТМЦ (ItemStatus)

| Ключ | Значение | Описание |
|------|----------|----------|
| `created` | "Создано" | ТМЦ только создано в системе |
| `at_work` | "В работе" | ТМЦ выдано в работу бригаде |
| `in_repair` | "В ремонте" | ТМЦ находится в ремонте |
| `issued` | "Выдано" | ТМЦ выдано (распределено) |
| `available` | "Доступно" | ТМЦ доступно на складе |
| `confirm` | "Требует подтверждения" | Ожидает подтверждения от кладовщика |
| `confirm_repair` | "Подтвердить ремонт" | Ожидает подтверждения начала ремонта |
| `written_off` | "Списано" | ТМЦ списано |

### Матрица переходов статусов

```
┌─────────────────────────────────────────────────────────────────────┐
│ Операция              │ Из статуса          │ В статус             │
├─────────────────────────────────────────────────────────────────────┤
│ Создание ТМЦ         │ (новое)             │ available/created     │
│ Подтверждение         │ created             │ available            │
│ Распределение         │ available           │ confirm              │
│ Выдача в работу      │ available, confirm  │ at_work              │
│ Возврат с работы     │ at_work             │ issued               │
│ Отправка в ремонт    │ issued, at_work     │ confirm_repair       │
│ Подтверждение ремонта │ confirm_repair      │ in_repair            │
│ Возврат из ремонта   │ in_repair           │ issued               │
│ Списание              │ ЛЮБОЙ               │ written_off          │
│ Отмена списания       │ written_off         │ available            │
└─────────────────────────────────────────────────────────────────────┘
```

### Детальная матрица переходов

| Текущий статус | Допустимые следующие статусы |
|---------------|----------------------------|
| `CREATED` | `AVAILABLE` |
| `AVAILABLE` | `CONFIRM`, `AT_WORK` |
| `CONFIRM` | `ISSUED`, `AT_WORK` |
| `AT_WORK` | `ISSUED`, `CONFIRM_REPAIR` |
| `ISSUED` | `CONFIRM_REPAIR`, `CONFIRM` |
| `CONFIRM_REPAIR` | `IN_REPAIR` |
| `IN_REPAIR` | `ISSUED` |
| `WRITTEN_OFF` | `AVAILABLE` |

---

## 2. РОЛИ ПОЛЬЗОВАТЕЛЕЙ (UserRole)

| Ключ | Значение | Описание |
|------|----------|----------|
| `admin` | "Администратор" | Полный доступ к системе |
| `storekeeper` | "Кладовщик" | Может подтверждать ТМЦ, управлять складом |
| `foreman` | "Бригадир" | Бригадир, работает с ТМЦ |

### Методы проверки ролей в модели User

```python
user.is_admin()      # True если роль = admin
user.is_storekeeper()  # True если роль = storekeeper
user.is_foreman()   # True если роль = foreman
```

---

## 3. ДЕЙСТВИЯ ИСТОРИИ (HistoryAction)

| Ключ | Значение | Шаблон сообщения |
|------|----------|------------------|
| `accepted` | "ТМЦ принято" | "ТМЦ принято. Объект - {location}" |
| `rejected` | "ТМЦ не принято" | "ТМЦ не принято. Возвращено на объект - {location}" |
| `sent_to_service` | "Отправлено в сервис" | "Отправлено в сервис. Причина: {reason}" |
| `returned_from_service` | "Возвращено из сервиса" | "Возвращено из сервиса" |
| `repair_confirmed` | "Ремонт подтверждён" | "Ремонт подтверждён" |
| `updated` | "Обновление информации" | "Обновление информации. Комментарий: {comment}" |
| `status_changed` | "Смена статуса" | "Смена статуса: {old_status} → {new_status}" |
| `locked` | "Заблокировано" | "Заблокировано: {username}" |
| `unlocked` | "Разблокировано" | "Разблокировано" |
| `assigned` | "ТМЦ распределено" | "ТМЦ распределено" |
| `confirmed` | "ТМЦ подтверждено" | "ТМЦ подтверждено. Комментарий: {comment}" |

---

## 4. ПУБЛИЧНЫЕ API (REST Endpoints)

### 4.1 Основные CRUD операции

| Метод | URL | Описание | Permissions |
|-------|-----|----------|-------------|
| `GET` | `/api/items/` | Получить список ТМЦ с поиском | Аутентифицированные |
| `POST` | `/api/items/` | Создать новое ТМЦ | Аутентифицированные |
| `GET` | `/api/items/<id>/` | Получить детали ТМЦ | Аутентифицированные |
| `PUT/PATCH` | `/api/items/<id>/` | Обновить ТМЦ | Аутентифицированные |
| `DELETE` | `/api/items/<id>/` | Удалить ТМЦ | Аутентифицированные |

#### GET /api/items/ - Параметры запроса
```
- search: str (опционально) - поиск по названию или статусу
```

#### POST /api/items/ - Тело запроса (JSON)
```json
{
  "name": "Наименование ТМЦ",
  "serial": "Серийный номер",
  "brand": "Бренд",
  "status": "created",
  "responsible": "Ответственный",
  "location": "Локация",
  "qty": 1,
  "brigade": null или ID бригады
}
```

### 4.2 Сервисные операции

| Метод | URL | Описание | Permissions |
|-------|-----|----------|-------------|
| `POST` | `/api/items/<id>/send-to-service/` | Отправить в сервис | Аутентифицированные |
| `POST` | `/api/items/<id>/return-from-service/` | Вернуть из сервиса | Аутентифицированные |
| `POST` | `/api/items/<id>/confirm-repair/` | Подтвердить начало ремонта | Аутентифицированные |
| `POST` | `/api/items/<id>/confirm/` | Подтвердить ТМЦ (confirm → available) | IsStorekeeper |
| `POST` | `/api/items/<id>/confirm-tmc/` | Принять/отклонить ТМЦ | IsStorekeeper |

#### POST /api/items/<id>/send-to-service/ - Тело запроса
```json
{
  "reason": "Причина отправки в сервис"
}
```

#### POST /api/items/<id>/return-from-service/ - Тело запроса
```json
{
  "action": "return" | "confirm_repair"
}
```

#### POST /api/items/<id>/confirm-tmc/ - Тело запроса
```json
{
  "action": "accept" | "reject"
}
```

### 4.3 Блокировка ТМЦ

| Метод | URL | Описание | Permissions |
|-------|-----|----------|-------------|
| `POST` | `/api/items/<id>/lock/` | Заблокировать ТМЦ | Аутентифицированные |
| `POST` | `/api/items/<id>/unlock/` | Разблокировать ТМЦ | Аутентифицированные |

### 4.4 Справочники

| Метод | URL | Описание | Permissions |
|-------|-----|----------|-------------|
| `GET` | `/api/locations/` | Список локаций | Аутентифицированные |
| `GET` | `/api/brigades/` | Список бригад | Аутентифицированные |
| `POST` | `/api/brigades/` | Создать бригаду | Аутентифицированные |

### 4.5 Аналитика и статистика

| Метод | URL | Описание | Permissions |
|-------|-----|----------|-------------|
| `GET` | `/api/status-counters/` | Счетчики статусов | Аутентифицированные |
| `GET` | `/api/analytics-data/` | Аналитика по ТМЦ | Аутентифицированные |

#### GET /api/status-counters/ - Ответ
```json
{
  "to_receive": 5,
  "to_repair": 2,
  "issued": 10
}
```

#### GET /api/analytics-data/ - Параметры
```
- name: str (опционально) - фильтр по названию
- brand: str (опционально) - фильтр по бренду
- location: str (опционально) - фильтр по локации
```

#### GET /api/analytics-data/ - Ответ
```json
{
  "by_brand": [{"brand": "Makita", "value": 10}],
  "by_location": [{"location": "Склад 1", "value": 15}],
  "by_status": [{"status": "available", "value": 20}],
  "details": [...]
}
```

### 4.6 Health Check

| Метод | URL | Описание | Permissions |
|-------|-----|----------|-------------|
| `GET` | `/api/hello/` | Health check | AllowAny |

---

## 5. КЛАССЫ РАЗРЕШЕНИЙ (Permissions)

| Класс | Описание | Доступ |
|-------|----------|--------|
| `IsStorekeeper` | Только кладовщики и админы | admin, storekeeper |
| `IsAdmin` | Только администраторы | admin |
| `IsForeman` | Только бригадиры и админы | admin, foreman |
| `IsAdminOrStorekeeper` | Админы или кладовщики | admin, storekeeper |
| `IsAdminOrForeman` | Админы или бригадиры | admin, foreman |
| `IsAuthenticatedWithRole` | Любой аутентифицированный с ролью | все роли |

---

## 6. КОМАНДЫ (Commands)

> Commands изменяют состояние системы. Все команды используют LockService для блокировки и HistoryService для записи истории.

### 6.1 ConfirmTMCCommand

**Файл:** `items/services/commands/confirm_tmc.py`

```python
ConfirmTMCCommand.execute(item_id: int, action: str, user) -> int
```

| Параметр | Тип | Описание |
|----------|-----|----------|
| `item_id` | int | ID ТМЦ |
| `action` | str | "accept" или "reject" |
| `user` | User | Текущий пользователь |

**Логика:**
- `accept`: CREATED → AVAILABLE
- `reject`: CONFIRM → ISSUED

**Требования к статусу:**
- accept: только CREATED
- reject: только CONFIRM

**Исключения:**
- `DomainValidationError`: Недопустимый статус или действие

---

### 6.2 ConfirmItemCommand

**Файл:** `items/services/commands/confirm_item.py`

```python
ConfirmItemCommand.execute(item_id: int, comment: str, user) -> int
```

| Параметр | Тип | Описание |
|----------|-----|----------|
| `item_id` | int | ID ТМЦ |
| `comment` | str | Комментарий к подтверждению |
| `user` | User | Текущий пользователь |

**Логика:**
- CONFIRM → AVAILABLE

**Требования к статусу:**
- Только CONFIRM

**История:**
- `confirmed` - с комментарием

---

### 6.3 SendToServiceCommand

**Файл:** `items/services/commands/send_to_service.py`

```python
SendToServiceCommand.execute(item_id: int, reason: str, user) -> int
```

| Параметр | Тип | Описание |
|----------|-----|----------|
| `item_id` | int | ID ТМЦ |
| `reason` | str | Причина отправки в сервис |
| `user` | User | Текущий пользователь |

**Логика:**
- AVAILABLE/ISSUED/AT_WORK → CONFIRM_REPAIR
- Сбрасывает связь с бригадой

**Требования к статусу:**
- ISSUED или AT_WORK

**История:**
- `sent_to_service` - с причиной

---

### 6.4 ReturnFromServiceCommand

**Файл:** `items/services/commands/return_from_service.py`

```python
ReturnFromServiceCommand.execute(item_id: int, action: str, user) -> int
```

| Параметр | Тип | Описание |
|----------|-----|----------|
| `item_id` | int | ID ТМЦ |
| `action` | str | "confirm_repair" или "return" |
| `user` | User | Текущий пользователь |

**Логика:**
- `confirm_repair`: CONFIRM_REPAIR → IN_REPAIR
- `return`: IN_REPAIR → ISSUED

**Требования к статусу:**
- confirm_repair: только CONFIRM_REPAIR
- return: только IN_REPAIR

**История:**
- `repair_confirmed` - при подтверждении
- `returned_from_service` - при возврате

---

### 6.5 UpdateItemCommand

**Файл:** `items/services/commands/update_item.py`

```python
UpdateItemCommand.execute(item_id: int, data: dict, user) -> int
```

| Параметр | Тип | Описание |
|----------|-----|----------|
| `item_id` | int | ID ТМЦ |
| `data` | dict | Словарь полей для обновления |
| `user` | User | Текущий пользователь |

**Специальные поля:**
- `service_comment`: комментарий для истории (не сохраняется в модель)

**История:**
- `updated` - с комментарием
- `status_changed` - если изменился статус

---

## 7. ЗАПРОСЫ (Queries)

> Queries только читают состояние, не изменяют его.

### 7.1 GetItemQuery

**Файл:** `items/services/queries/get_item.py`

```python
GetItemQuery.by_id(item_id: int) -> Item | None
GetItemQuery.with_details(item_id: int) -> Item | None
```

| Метод | Возвращает | Описание |
|-------|-----------|----------|
| `by_id()` | Item или None | Получает ТМЦ по ID |
| `with_details()` | Item или None | Получает ТМЦ с prefetched историей |

---

### 7.2 ListItemsQuery

**Файл:** `items/services/queries/list_items.py`

```python
ListItemsQuery.all(search_query: str = None) -> QuerySet
ListItemsQuery.with_details(search_query: str = None) -> QuerySet
```

| Параметр | Тип | Описание |
|----------|-----|----------|
| `search_query` | str | Поиск по названию или статусу |

---

### 7.3 GetStatusCountersQuery

**Файл:** `items/services/queries/get_status_counters.py`

```python
GetStatusCountersQuery.all() -> dict
GetStatusCountersQuery.summary() -> dict
```

**all()** - возвращает {status: count}

**summary()** - возвращает для UI:
```json
{
  "to_receive": 5,    // CONFIRM
  "to_repair": 2,     // CONFIRM_REPAIR
  "issued": 10        // ISSUED + AT_WORK
}
```

---

### 7.4 GetAnalyticsQuery

**Файл:** `items/services/queries/get_analytics.py`

```python
GetAnalyticsQuery.filtered(name: str = None, brand: str = None, location: str = None) -> dict
GetAnalyticsQuery.all() -> dict
```

**Возвращает:**
```json
{
  "by_brand": [{"brand": "Makita", "value": 10}],
  "by_location": [{"location": "Склад 1", "value": 15}],
  "by_status": [{"status": "available", "value": 20}],
  "details": QuerySet
}
```

---

### 7.5 GetItemHistoryQuery

**Файл:** `items/services/queries/get_item_history.py`

```python
GetItemHistoryQuery.all(item_id: int, limit: int = None) -> QuerySet
GetItemHistoryQuery.recent(item_id: int, days: int = 30) -> QuerySet
GetItemHistoryQuery.with_action(item_id: int, action_pattern: str) -> QuerySet
```

---

### 7.6 ListItemsForConfirmQuery

**Файл:** `items/services/queries/list_items_for_confirm.py`

```python
ListItemsForConfirmQuery.all() -> QuerySet
ListItemsForConfirmQuery.by_location(location_name: str) -> QuerySet
ListItemsForConfirmQuery.count() -> int
```

**Фильтры:**
- Статус = CONFIRM
- Сортировка по ID (DESC)

---

## 8. СЕРВИСЫ

### 8.1 LockService

**Файл:** `items/services/lock_service.py`

```python
LockService.lock(item_id: int, user) -> Item
LockService.unlock(item_id: int, user) -> None
LockService.is_locked(item: Item) -> bool
LockService.can_edit(item: Item, user) -> bool
```

**Назначение:** Предотвращение одновременного редактирования ТМЦ

**Поля блокировки в модели Item:**
- `locked_by`: ForeignKey на User
- `locked_at`: DateTimeField

**Исключения:**
- `DomainConflictError`: ТМЦ уже заблокировано другим пользователем

---

### 8.2 HistoryService

**Файл:** `items/services/history_service.py`

Методы для создания записей истории:

| Метод | Параметры | Тип действия |
|-------|-----------|--------------|
| `accepted()` | item, user, location | ТМЦ принято |
| `rejected()` | item, user, location | ТМЦ отклонено |
| `sent_to_service()` | item, user, reason, location | Отправлено в сервис |
| `returned_from_service()` | item, user, location | Возвращено из сервиса |
| `repair_confirmed()` | item, user, location | Ремонт подтверждён |
| `updated()` | item, user, comment, location | Обновление информации |
| `status_changed()` | item, user, old_status, new_status, location | Смена статуса |
| `locked()` | item, user, location | ТМЦ заблокировано |
| `unlocked()` | item, user, location | ТМЦ разблокировано |
| `assigned()` | item, user, location | ТМЦ распределено |
| `confirmed()` | item, user, comment, location | ТМЦ подтверждено |
| `get_first_assignment()` | item | Получить первую запись о распределении |

---

### 8.3 ItemTransitions (Domain)

**Файл:** `items/services/domain/item_transitions.py`

```python
ItemTransitions.can_transition(from_status, to_status) -> bool
ItemTransitions.validate_transition(from_status, to_status) -> None
ItemTransitions.can_send_to_service(status) -> bool
ItemTransitions.can_return_from_service(status) -> bool
ItemTransitions.can_write_off(status) -> bool
```

**Исключения:**
- `DomainValidationError`: Недопустимый переход статуса

---

## 9. МОДЕЛИ ДАННЫХ

### 9.1 Item (ТМЦ)

| Поле | Тип | Описание |
|------|-----|----------|
| `id` | AutoField | Первичный ключ |
| `name` | CharField | Наименование |
| `serial` | CharField | Серийный номер |
| `brand` | CharField | Бренд |
| `status` | CharField (choices) | Статус |
| `responsible` | CharField | Ответственный |
| `location` | CharField | Локация |
| `qty` | IntegerField | Количество |
| `brigade` | ForeignKey | Закрепленная бригада |
| `locked_by` | ForeignKey | Кем заблокировано |
| `locked_at` | DateTimeField | Время блокировки |

### 9.2 Location (Локация)

| Поле | Тип | Описание |
|------|-----|----------|
| `id` | AutoField | Первичный ключ |
| `name` | TextField | Название (уникальное) |

### 9.3 Brigade (Бригада)

| Поле | Тип | Описание |
|------|-----|----------|
| `id` | AutoField | Первичный ключ |
| `name` | CharField | Название |
| `brigadier` | CharField | Бригадир |
| `responsible` | CharField | Ответственный |

### 9.4 ItemHistory (История ТМЦ)

| Поле | Тип | Описание |
|------|-----|----------|
| `id` | AutoField | Первичный ключ |
| `item` | ForeignKey | Ссылка на ТМЦ |
| `action` | CharField | Текст действия |
| `action_type` | CharField (choices) | Тип действия |
| `payload` | JSONField | Структурированные параметры |
| `comment` | TextField | Комментарий |
| `user` | ForeignKey | Пользователь |
| `location` | ForeignKey | Локация |
| `timestamp` | DateTimeField | Время события |

### 9.5 User (Пользователь)

| Поле | Тип | Описание |
|------|-----|----------|
| `id` | AutoField | Первичный ключ |
| `username` | CharField | Имя пользователя |
| `role` | CharField (choices) | Роль |
| `email` | EmailField | Email |
| `is_staff` | BooleanField | Статус персонала |
| `is_superuser` | BooleanField | Суперпользователь |

---

## 10. ДОМЕННЫЕ ИСКЛЮЧЕНИЯ

| Класс | Наследует | Описание |
|-------|----------|----------|
| `DomainError` | Exception | Базовое доменное исключение |
| `DomainValidationError` | DomainError | Ошибка валидации бизнес-правил |
| `DomainConflictError` | DomainError | Ошибка конфликта состояния |

---

## 11. СЕРИАЛИЗАТОРЫ

| Сериализатор | Модель | Назначение |
|--------------|--------|------------|
| `ItemSerializer` | Item | CRUD операции с ТМЦ |
| `LocationSerializer` | Location | Локации |
| `BrigadeSerializer` | Brigade | Бригады |
| `ItemHistorySerializer` | ItemHistory | История ТМЦ |
| `StatusCounterSerializer` | - | Счетчики статусов |
| `ConfirmTMCSerializer` | - | Подтверждение/отклонение ТМЦ |

---

## 12. СТИЛИ СТАТУСОВ (Frontend)

**Файл:** `frontend/src/constants/statusConfig.js`

| Статус | Тёмная тема | Светлая тема |
|--------|-------------|--------------|
| created | blue-500 | blue-700 |
| at_work | sky-500 | sky-700 |
| issued | sky-500 | sky-700 |
| available | emerald-500 | emerald-700 |
| in_repair | rose-500 | rose-700 |
| confirm | amber-500 | amber-700 |
| confirm_repair | amber-500 | amber-700 |
| written_off | slate-500 | gray-600 |

---

## 13. ВСПОМОГАТЕЛЬНЫЕ ФАЙЛЫ

### Шаблоны истории (HistoryActionTemplates)

```python
class HistoryActionTemplates:
    TEMPLATES = {
        "accepted": "ТМЦ принято. Объект - {location}",
        "rejected": "ТМЦ не принято. Возвращено на объект - {location}",
        "sent_to_service": "Отправлено в сервис. Причина: {reason}...",
        "returned_from_service": "Возвращено из сервиса",
        "repair_confirmed": "Ремонт подтверждён",
        "updated": "Обновление информации. Комментарий: {comment}",
        "status_changed": "Смена статуса: {old_status} → {new_status}",
        "locked": "Заблокировано: {username}",
        "unlocked": "Разблокировано",
        "assigned": "ТМЦ распределено",
        "confirmed": "ТМЦ подтверждено. Комментарий: {comment}",
    }
```

---

## 14. ПРИМЕРЫ ИСПОЛЬЗОВАНИЯ API

### Создание ТМЦ
```bash
curl -X POST /api/items/ \
  -H "Content-Type: application/json" \
  -d '{"name": "Перфоратор", "brand": "Makita", "location": "Склад 1"}'
```

### Получение списка с поиском
```bash
curl "/api/items/?search=Перфоратор"
```

### Отправка в сервис
```bash
curl -X POST /api/items/1/send-to-service/ \
  -H "Content-Type: application/json" \
  -d '{"reason": "Сломался бойок"}'
```

### Подтверждение ремонта
```bash
curl -X POST /api/items/1/return-from-service/ \
  -H "Content-Type: application/json" \
  -d '{"action": "confirm_repair"}'
```

### Возврат из сервиса
```bash
curl -X POST /api/items/1/return-from-service/ \
  -H "Content-Type: application/json" \
  -d '{"action": "return"}'
```

### Подтверждение ТМЦ кладовщиком
```bash
curl -X POST /api/items/1/confirm-tmc/ \
  -H "Content-Type: application/json" \
  -d '{"action": "accept"}'
```

### Получение аналитики
```bash
curl "/api/analytics-data/?brand=Makita&location=Склад+1"
```

### Блокировка/разблокировка
```bash
curl -X POST /api/items/1/lock/
curl -X POST /api/items/1/unlock/
```

---

*Документация автоматически сгенерирована из исходного кода проекта my-k3s-app*

