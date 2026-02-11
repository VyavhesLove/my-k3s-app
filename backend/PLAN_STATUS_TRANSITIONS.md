# План: Рефакторинг переходов статусов ТМЦ

## Информация собрана:

### Текущие статусы (enums.py):
- `at_work` - В работе
- `in_repair` - В ремонте
- `issued` - Выдано
- `available` - Доступно
- `confirm` - Требует подтверждения
- `confirm_repair` - Подтвердить ремонт

### Текущая логика переходов:

1. **SendToServiceCommand**: `available`, `at_work`, `issued` → `in_repair`
2. **ReturnFromServiceCommand._return**: `in_repair` → `confirm_repair`
3. **ReturnFromServiceCommand._confirm**: `confirm_repair` → `issued` ⚠️ **ручная проверка**
4. **ConfirmItemCommand**: `confirm` → `available`
5. **ConfirmTMCCommand._accept**: `confirm` → `issued`
6. **ConfirmTMCCommand._reject**: `confirm` → `issued` (с восстановлением)
7. **UpdateItemCommand**: любые изменения статуса без валидации ⚠️ **потенциальная проблема**

## План рефакторинга:

### Шаг 1: Создать централизованную таблицу ALLOWED_TRANSITIONS
Файл: `my-k3s-app/backend/items/services/domain/item_transitions.py`

```python
ALLOWED_TRANSITIONS = {
    # Отправка в сервис
    ItemStatus.AVAILABLE: [ItemStatus.IN_REPAIR],
    ItemStatus.AT_WORK: [ItemStatus.IN_REPAIR],
    ItemStatus.ISSUED: [ItemStatus.IN_REPAIR],
    
    # Возврат из сервиса (ожидание подтверждения)
    ItemStatus.IN_REPAIR: [ItemStatus.CONFIRM_REPAIR],
    
    # Подтверждение ремонта
    ItemStatus.CONFIRM_REPAIR: [ItemStatus.ISSUED],
    
    # Подтверждение ТМЦ
    ItemStatus.CONFIRM: [ItemStatus.AVAILABLE, ItemStatus.ISSUED],
}
```

### Шаг 2: Добавить универсальный метод can_transition()
```python
@classmethod
def can_transition(cls, from_status: ItemStatus, to_status: ItemStatus) -> bool:
    """Проверка допустимости перехода."""
    return to_status in cls.ALLOWED_TRANSITIONS.get(from_status, [])
```

### Шаг 3: Заменить ручные проверки

#### Файл: `return_from_service.py` (ReturnFromServiceCommand._confirm)
**Было:**
```python
if item.status != ItemStatus.CONFIRM_REPAIR:
    raise DomainValidationError(...)
```

**Стало:**
```python
ItemTransitions.validate_transition(item.status, ItemStatus.ISSUED)
```

### Шаг 4: Добавить validate_transition() метод
```python
@classmethod
def validate_transition(cls, from_status: ItemStatus, to_status: ItemStatus) -> None:
    """Валидация перехода. Raises DomainValidationError."""
    if not cls.can_transition(from_status, to_status):
        raise DomainValidationError(
            f"Недопустимый переход статуса: '{from_status}' → '{to_status}'. "
            f"Допустимые переходы: {cls.ALLOWED_TRANSITIONS.get(from_status, [])}"
        )
```

### Шаг 5: Обновить UpdateItemCommand (опционально)
Добавить валидацию при изменении статуса.

## Файлы для редактирования:
1. `my-k3s-app/backend/items/services/domain/item_transitions.py` - основные изменения
2. `my-k3s-app/backend/items/services/commands/return_from_service.py` - убрать ручную проверку

## Ожидаемый результат:
- Единая точка определения допустимых переходов
- Расширяемая система (легко добавить новые переходы)
- Устранены дублирования проверок
- Более понятные сообщения об ошибках

