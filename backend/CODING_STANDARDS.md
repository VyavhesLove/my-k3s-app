# Стандарты разработки Backend

## 1. Использование Enum для статусов

### Всегда используйте `ItemStatus` enum вместо магических строк

**❌ Неправильно:**
```python
item.status = 'issued'
if item.status == 'confirm':
    ...
```

**✅ Правильно:**
```python
from .enums import ItemStatus

item.status = ItemStatus.ISSUED
if item.status == ItemStatus.CONFIRM:
    ...
```

### Где определены статусы

Все статусы ТМЦ определены в `items/enums.py`:

```python
class ItemStatus(models.TextChoices):
    AT_WORK = "at_work", "В работе"
    IN_REPAIR = "in_repair", "В ремонте"
    ISSUED = "issued", "Выдано"
    AVAILABLE = "available", "Доступно"
    CONFIRM = "confirm", "Требует подтверждения"
    CONFIRM_REPAIR = "confirm_repair", "Подтвердить ремонт"
```

### Почему это важно

1. **Type safety** - компилятор/IDE подскажет ошибки
2. **Centralized** - все статусы в одном месте
3. **Autocomplete** - IDE подскажет доступные статусы
4. **Refactoring** - легко находить использования статусов
5. **Validation** - невозможно опечататься в статусе

## 2. Использование ItemLockService при модификации

### Всегда блокируйте ТМЦ перед изменением

При любых операциях записи/изменения данных ТМЦ через API необходимо использовать `ItemLockService`:

```python
from .services import ItemLockService

@api_view(['POST'])
def my_view(request, item_id):
    """Пример с блокировкой"""
    # 1. Блокируем (проверяем права и состояние)
    item = ItemLockService.lock_item(item_id, request.user)
    
    try:
        # 2. Ваша логика изменения
        item.status = ItemStatus.CONFIRM_REPAIR
        item.save()
        
        # 3. Создаём запись в истории
        ItemHistory.objects.create(
            item=item,
            action="ТМЦ отправлено в ремонт",
            user=request.user.username
        )
        
    finally:
        # 4. Всегда разблокируем!
        ItemLockService.unlock_item(item_id, request.user)
    
    return Response({"success": True})
```

### Когда НЕ нужна блокировка

- Только чтение данных (`GET` запросы)
- Методы, которые уже используют сервисы с встроенной блокировкой

### Когда блокировка ОБЯЗАТЕЛЬНА

- Любое изменение `item.status`
- Изменение `item.responsible`
- Изменение `item.location`
- Изменение `item.brigade`
- Любые операции с ItemHistory

## 3. Структура сервисов

### Новый сервис должен следовать паттерну

```python
class MyService:
    @staticmethod
    @transaction.atomic
    def do_something(item_id, user, **kwargs):
        """
        Описание метода.
        @transaction.atomic - ОБЯЗАТЕЛЬНО для операций с БД.
        """
        # 1. Блокируем
        item = ItemLockService.lock_item(item_id, user)
        
        try:
            # 2. Валидация
            if item.status != ItemStatus.CONFIRM:
                raise ValueError("ТМЦ не требует подтверждения")
            
            # 3. Логика
            item.status = ItemStatus.ISSUED
            item.save()
            
            # 4. История
            ItemHistory.objects.create(
                item=item,
                action="Действие выполнено",
                user=user.username
            )
            
        finally:
            # 5. Разблокировка
            ItemLockService.unlock_item(item_id, user)
```

## 4. Чек-лист перед коммитом

- [ ] Все статусы используют `ItemStatus` enum
- [ ] Все операции записи используют `ItemLockService`
- [ ] Все сервисы с БД операциями имеют `@transaction.atomic`
- [ ] Всегда есть `try/finally` для разблокировки
- [ ] Тесты покрывают новую функциональность

## 5. Примеры API вьюх

См. `items/views.py` для примеров правильного использования:
- `send_to_service()` - отправка в ремонт
- `return_from_service()` - возврат из ремонта  
- `confirm_repair()` - подтверждение ремонта
- `confirm_item()` - подтверждение ТМЦ
- `update_item()` - обновление с блокировкой

