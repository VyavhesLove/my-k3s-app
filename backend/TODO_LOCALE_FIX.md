# TODO: Убрать форматиование валюты из шаблонов истории

## Задача
Шаблоны текста не должны включать форматирование чисел/валюты — это работа фронта.
Backend должен хранить: amount: "1234.50"
Форматирование в рубли, разделители пусть делает frontend.

## Выполнено
- [x] 1. Изменить шаблон written_off в enums.py (убрать "руб.")
- [x] 2. Обновить тесты test_history_actions.py (2 теста written_off)
- [x] 3. Запустить тесты для проверки

## Результаты тестов
- 112 passed, 4 failed
- 4 failed: pre-existing bugs в HistoryAction.build() и cancelled_write_off (НЕ связаны с этим изменением)

## Файлы изменены
1. `items/enums.py` — шаблон written_off без "руб."
2. `tests/test_history/test_history_actions.py` — исправлены 2 теста

