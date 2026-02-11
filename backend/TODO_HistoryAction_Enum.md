# TODO: Рефакторинг HistoryAction в Enum

## Шаги:
1. [x] Добавить HistoryAction Enum в enums.py
2. [x] Обновить history_actions.py - создать HistoryActionsFormatter с методами форматирования
3. [x] Обновить history_service.py - заменить action="assigned" на HistoryAction.ASSIGNED
4. [x] Обновить lock_service.py - использовать HistoryActionsFormatter
5. [x] Обновить update_item.py - использовать HistoryService
6. [x] Обновить send_to_service.py - использовать HistoryService
7. [x] Обновить return_from_service.py - использовать HistoryService
8. [x] Обновить confirm_item.py - использовать HistoryService
9. [x] Обновить confirm_tmc.py - использовать HistoryService
10. [x] Обновить models.py - добавить поле action_type в ItemHistory

## Требуется миграция БД:
```bash
python manage.py makemigrations
python manage.py migrate
```

