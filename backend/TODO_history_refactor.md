# TODO: Рефакторинг History Actions Architecture ✅ ЗАВЕРШЁН

## Цель
Упростить архитектуру истории действий, убрав дублирование слоёв.

## Текущее состояние (проблема)
- 4 уровня абстракции: payload-функции → create_* → HistoryActionsFormatter → HistoryService
- HistoryActionsFormatter просто проксирует вызовы без добавленной ценности
- Дублирование кода

## План рефакторинга ✅ ВЫПОЛНЕНО

### Шаг 1: Обновить enums.py ✅
- [x] Добавить метод `build(**kwargs)` в `HistoryAction`
- [x] Метод возвращает `(action_type, action_text, payload)`

### Шаг 2: Обновить history_service.py ✅
- [x] Заменить вызовы `create_*()` на `HistoryAction.XXX.build()`
- [x] Убрать импорт `create_*` функций

### Шаг 3: Удалить history_actions.py ✅
- [x] Удалить файл `history_actions.py` полностью
- [x] Удалить импорты в `domain/__init__.py`

### Шаг 4: Обновить domain/__init__.py ✅
- [x] Убрать `HistoryActionsFormatter` из экспортов

### Шаг 5: Обновить services/__init__.py ✅
- [x] Убрать `HistoryActionsFormatter` из экспортов

### Шаг 6: Запустить тесты ✅
- [x] Проверить что все тесты проходят — **52 теста OK**

## Пример нового API

**До:**
```python
action_type, action_text, payload = create_accepted(location)
```

**После:**
```python
action_type, action_text, payload = HistoryAction.ACCEPTED.build(location=location)
```

## Новая структура файлов после рефакторинга

```
backend/items/
├── enums.py                  # HistoryAction с методом build()
├── models.py
├── services/
│   ├── history_service.py    # Использует HistoryAction.XXX.build()
│   ├── domain/
│   │   ├── __init__.py       # Без HistoryActionsFormatter
│   │   └── item_transitions.py
│   └── ...
└── ...
```

