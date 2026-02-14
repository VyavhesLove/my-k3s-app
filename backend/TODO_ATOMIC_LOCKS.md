# TODO: Переход на select_for_update() для атомарности

## ✅ Выполненные изменения

### 1. confirm_item.py ✅
- [x] Убран импорт LockService
- [x] Заменён `LockService.lock()` на `Item.objects.select_for_update().get()`
- [x] Убран `try/finally` с `LockService.unlock()`
- [x] Добавлена история смены статуса (STATUS_CHANGED)

### 2. confirm_tmc.py ✅
- [x] Убран импорт LockService
- [x] Заменён `LockService.lock()` на `Item.objects.select_for_update().get()`
- [x] Убран `try/finally` с `LockService.unlock()`
- [x] Добавлена история смены статуса (STATUS_CHANGED)

### 3. send_to_service.py ✅
- [x] Убран импорт LockService
- [x] Заменён `LockService.lock()` на `Item.objects.select_for_update().get()`
- [x] Убран `try/finally` с `LockService.unlock()`
- [x] Добавлена история смены статуса (STATUS_CHANGED)

### 4. return_from_service.py ✅
- [x] Убран импорт LockService
- [x] Заменён `LockService.lock()` на `Item.objects.select_for_update().get()`
- [x] Убран `try/finally` с `LockService.unlock()`
- [x] Добавлена история смены статуса (STATUS_CHANGED)

### 5. update_item.py ✅
- [x] Убран импорт LockService
- [x] Заменён `LockService.lock()` на `Item.objects.select_for_update().get()`
- [x] Убран `try/finally` с `LockService.unlock()`

## Проверенные файлы (не требовали изменений)
- ✅ write_off.py — уже использует select_for_update()
- ✅ cancel_write_off.py — уже использует select_for_update()

## Обновлённые тесты
- ✅ test_confirm_tmc.py — заменён тест `test_confirm_item_unlocks_after_error` на `test_confirm_item_creates_status_history`

## Принцип
- `@transaction.atomic` — обёртка транзакции (уже есть)
- `select_for_update()` — блокировка строки в БД (снимается автоматически)
- НЕ вызывать unlock вручную — блокировка транзакционная

## LockService после изменений
- Остаётся в `items/services/lock_service.py`
- Используется только во views для UI-подсказок
- НЕ используется в commands (business logic)

