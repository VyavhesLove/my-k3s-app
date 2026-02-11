# TODO: CQRS Refactoring - Commands return IDs

## Задачи
- [x] 1. UpdateItemCommand - изменить return item → return item.id
- [x] 2. views.py:send_to_service - использовать SendToServiceCommand + GetItemQuery
- [x] 3. views.py:item_detail (PUT/PATCH) - использовать UpdateItemCommand + GetItemQuery
- [x] 4. ReturnFromServiceCommand - изменить return item → return item.id
- [x] 5. views.py:return_from_service - использовать ReturnFromServiceCommand + GetItemQuery
- [x] 6. views.py:confirm_repair - использовать ReturnFromServiceCommand + GetItemQuery
- [x] 7. Создать ConfirmItemCommand
- [x] 8. views.py:confirm_item - использовать ConfirmItemCommand + GetItemQuery
- [x] 9. Обновить exports в __init__.py файлах

## Прогресс
Все задачи выполнены!

