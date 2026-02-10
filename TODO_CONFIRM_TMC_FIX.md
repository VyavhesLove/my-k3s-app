# TODO: Исправление select_for_update() в ConfirmTMCService

## Задача
Перенести получение `Item` с `select_for_update()` внутрь транзакции сервиса.

## План

### Шаг 1: Изменить services.py
- [x] Добавить метод `process(item_id, action, user)` с `@transaction.atomic` и `select_for_update()`
- [x] Убрать `@transaction.atomic` из `accept()` и `reject()` (т.к. транзакция будет в `process()`)
- [x] Переименовать `accept()` → `_accept()` и `reject()` → `_reject()` (приватные методы)

### Шаг 2: Изменить views.py
- [x] Упростить `ConfirmTMCAPIView.post()` — передавать только `item_id` в `ConfirmTMCService.process()`

## Статус
- [x] В процессе
- [x] Выполнено ✅

## Что было сделано:

**services.py:**
- Добавлен `process(item_id, action, user)` — точка входа с транзакцией
- `select_for_update()` теперь внутри `@transaction.atomic`
- `accept()` и `reject()` переименованы в `_accept()` и `_reject()` (без декоратора транзакции)

**views.py:**
- View теперь "тонкий" — только валидация и вызов сервиса
- Логика транзакции и блокировки — в сервисе

