# TODO: Исправления HistoryAction и связанных файлов

## Шаг 1: items/enums.py
- [x] Отделить HistoryActionTemplates в отдельный класс
- [x] Убрать TEMPLATES и методы get_template/format из HistoryAction
- [x] Убрать лишний импорт models

## Шаг 2: items/models.py
- [x] Добавить метод save() в ItemHistory с автогенерацией текста

## Шаг 3: services/domain/history_actions.py
- [x] Обновить импорт на HistoryActionTemplates
- [x] Добавить функции create_* возвращающие кортеж (action_type, action_text, payload)
- [x] Обновить format_action на использование HistoryActionTemplates.format()

## Шаг 4: services/history_service.py
- [x] Обновить импорт HistoryActionTemplates
- [x] Обновить использование HistoryActionTemplates.format()
- [x] Добавить метод get_first_assignment()

## Шаг 5: services/commands/confirm_tmc.py
- [x] Уже использует action_type в фильтре (через HistoryService.get_first_assignment)

