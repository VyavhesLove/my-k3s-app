# TODO: Рефакторинг переходов статусов ТМЦ

## Задачи:
- [x] 1. Обновить item_transitions.py: добавить ALLOWED_TRANSITIONS, can_transition(), validate_transition()
- [x] 2. Обновить return_from_service.py: заменить ручную проверку на validate_transition()
- [x] 3. Добавить новые статусы CREATED, WRITTEN_OFF в enums.py
- [x] 4. Обновить statusConfig.js с новыми статусами
- [x] 5. Обновить матрицу ALLOWED_TRANSITIONS

## ✅ Полная матрица переходов статусов (ALLOWED_TRANSITIONS):

| Операция              | Из статуса         | В статус      |
|-----------------------|--------------------|---------------|
| Создание ТМЦ         | created            | available     |
| Распределение         | available          | confirm        |
| Подтверждение         | confirm            | issued         |
| Выдача в бригаду      | available, confirm | at_work       |
| Возврат с работы     | at_work            | issued         |
| Отправка в ремонт    | issued, at_work    | confirm_repair|
| Подтверждение ремонта | confirm_repair     | in_repair     |
| Возврат из ремонта   | in_repair          | issued         |
| Списание              | Любой статус       | written_off   |
| Отмена списания       | written_off        | available      |

## Новый API:
```python
# Проверка возможности перехода
ItemTransitions.can_transition(from_status, to_status) → bool

# Валидация с исключением
ItemTransitions.validate_transition(from_status, to_status) → None

# Списание (из любого статуса)
ItemTransitions.can_write_off(status) → True
ItemTransitions.validate_write_off(status) → None
```

## Новые статусы:
- `created` (Создано) - начальный статус при создании ТМЦ
- `written_off` (Списано) - статус для списанных ТМЦ

## Изменения в командах:
- `send_to_service.py`: отправка → confirm_repair (а не in_repair)
- `return_from_service.py`:
  - `_confirm_repair`: confirm_repair → in_repair
  - `_return`: in_repair → issued

