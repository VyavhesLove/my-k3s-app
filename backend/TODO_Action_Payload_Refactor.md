# Рефакторинг HistoryAction - хранение payload

## Цель
Хранить action структурированно:
- `action_type` - enum значение
- `payload` (JSON) - параметры для динамической генерации текста

## Выполнено

### 1. Модель (`items/models.py`)
- [x] Добавить поле `payload = JSONField(null=True, blank=True)`
- [x] `action` поле стало nullable

### 2. Enum (`items/enums.py`)
- [x] Отделить шаблоны от `value` в атрибут `TEMPLATES`
- [x] Добавить метод `get_template()` для получения шаблона
- [x] Обновить метод `format(payload)` для генерации текста из payload

### 3. HistoryActionsFormatter (`services/domain/history_actions.py`)
- [x] Функции переименованы в `*_payload()` формат
- [x] Возвращают `payload` dict вместо форматированной строки

### 4. HistoryService (`services/history_service.py`)
- [x] Метод `create()` принимает `payload` dict
- [x] Сохраняет `payload` в БД
- [x] Генерирует `action` из payload динамически

### 5. LockService (`services/lock_service.py`)
- [x] Убран неиспользуемый импорт HistoryActionsFormatter

## Важно: Требуется миграция БД
```bash
python manage.py makemigrations
python manage.py migrate
```

## Преимущества нового подхода
- **Гибкость**: изменение текстов без миграции данных
- **Структурированность**: возможность фильтровать/агрегировать по payload полям
- **Масштабируемость**: легко добавлять новые типы действий

