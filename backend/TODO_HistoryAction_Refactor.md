# Рефакторинг HistoryAction - инкапсуляция форматирования

## Цель
Переместить логику форматирования строк из `HistoryActionsFormatter` в `HistoryAction` enum.

## План

### Шаг 1: Обновить `HistoryAction` enum (`items/enums.py`)
- Добавить метод `format(self, **kwargs)` в класс `HistoryAction`
- Обновить строковые шаблоны для поддержки форматирования

### Шаг 2: Обновить `HistoryActionsFormatter` (`services/domain/history_actions.py`)
- Убрать форматирование строк
- Оставить только возврат `HistoryAction` enum с параметрами
- Переименовать методы для ясности (например, `accepted_params()`)

### Шаг 3: Обновить `HistoryService` (`services/history_service.py`)
- Методы принимают `HistoryAction` и форматируют через `.format()`
- Убрать зависимость от `HistoryActionsFormatter`

### Шаг 4: Обновить импорты в командах
- Удалить неиспользуемые импорты `HistoryActionsFormatter`

## Статус

- [x] Шаг 1: Добавить метод `format()` в `HistoryAction`
- [x] Шаг 2: Обновить `HistoryActionsFormatter`
- [x] Шаг 3: Обновить `HistoryService`
- [x] Шаг 4: Очистить импорты в командах

