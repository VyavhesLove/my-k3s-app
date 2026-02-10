# TODO: Рефакторинг HistoryService

## Цель
Заменить все прямые вызовы `ItemHistory.objects.create` на `HistoryService.create`

## Прогресс

### services.py
- [x] Переместить HistoryService в начало файла
- [x] Обновить ConfirmTMCService._accept()
- [x] Обновить ConfirmTMCService._reject()
- [x] Обновить ItemLockService.lock_item()
- [x] Обновить ItemServiceService.send_to_service()

### views.py
- [x] Добавить импорт HistoryService
- [x] Обновить item_detail()
- [x] Обновить send_to_service()
- [x] Обновить return_from_service()
- [x] Обновить confirm_repair()
- [x] Обновить confirm_item()

## Результат
✅ Все прямые вызовы `ItemHistory.objects.create` в views.py заменены на `HistoryService.create()`
✅ Сервисный слой (services.py) также обновлен
✅ Единая точка создания истории через `HistoryService.create()`

