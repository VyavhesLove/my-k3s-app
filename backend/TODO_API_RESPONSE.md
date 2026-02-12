# TODO: Unified API Response Format

## Цель
Привести все API Views к единому стандарту ответа:
- Успех: `{"success": true, "data": {...}}`
- Ошибка: `{"success": false, "error": "..."}`

## Задачи

### 1. items/views/items.py
- [x] `item_list` - GET: использовать `{"success": true, "data": {"items": [...]}}`
- [x] `item_list` - POST: использовать unified формат
- [x] `item_detail` - PUT/PATCH: использовать unified формат
- [x] `item_detail` - DELETE: использовать unified формат
- [x] `item_detail` - обрабатывать DomainValidationError → 400
- [x] `item_detail` - обрабатывать Item.DoesNotExist → 404

### 2. items/views/services.py
- [x] `send_to_service` - добавить обработку DomainValidationError → 400
- [x] `return_from_service` - добавить обработку DomainValidationError → 400
- [x] `confirm_repair` - добавить обработку DomainValidationError → 400
- [x] `confirm_item` - использовать unified формат
- [x] `write_off_item` - использовать unified формат
- [x] `cancel_write_off_item` - использовать unified формат

### 3. items/views/locks.py
- [x] `lock_item` - добавить обработку DomainConflictError → 409
- [x] `unlock_item` - добавить обработку DomainConflictError → 409

### 4. items/views/confirm_tmc.py
- [x] `ConfirmTMCAPIView.post` - использовать unified формат

### 5. items/views/common.py
- [x] `get_status_counters` - использовать unified формат
- [x] `location_list` - использовать unified формат
- [x] `brigade_list` - использовать unified формат
- [x] `get_analytics` - использовать unified формат

## Статус
- [x] Все задачи выполнены
- [ ] Код проверен
- [ ] Тесты пройдены

