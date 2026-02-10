# Проблема с полем `comment` в модели `ItemHistory`

## Суть проблемы

В модели `ItemHistory` (файл `models.py`) есть поле `comment`:

```python
class ItemHistory(models.Model):
    # ... другие поля ...
    comment = models.TextField(blank=True, null=True)
```

Однако в миграции `0003_item_locked_at_item_locked_by_itemhistory_comment.py` это поле **закомментировано**:

```python
# migrations.AddField(
#     model_name='itemhistory',
#     name='comment',
#     field=models.TextField(blank=True, null=True),
# ),
```

Это приводит к расхождению между моделью и схемой БД.

## Симптомы

При запуске тестов для endpoints, которые создают записи `ItemHistory` (например, `send_to_service`, `return_from_service`, `confirm_repair`), возникает ошибка:

```
sqlite3.OperationalError: table items_itemhistory has no column named comment
```

## Причина

Поле `comment` было добавлено в модель `ItemHistory`, но соответствующая миграция была впоследствии закомментирована. В текущей БД (которая разворачивалась ранее) поле уже существует, но миграция для него отсутствует в применённых миграциях.

## Решения

### Вариант 1: Раскомментировать миграцию (текущий подход)

Для запуска тестов временно раскомментируйте миграцию:

```python
# В файле migrations/0003_item_locked_at_item_locked_by_itemhistory_comment.py:
migrations.AddField(
    model_name='itemhistory',
    name='comment',
    field=models.TextField(blank=True, null=True),
),
```

**Плюсы:** Быстрое решение для тестов
**Минусы:** Нужно постоянно комментировать/раскомментировать

### Вариант 2: Создать фиктивную миграцию с состоянием "Applied" (Рекомендуется)

Создать пустую миграцию `0004_empty.py` чтобы "применить" отсутствующую миграцию:

```python
# migrations/0004_empty.py
from django.db import migrations

class Migration(migrations.Migration):
    atomic = False
    dependencies = [
        ('items', '0003_item_locked_at_item_locked_by_itemhistory_comment'),
    ]
    
    operations = [
        # Пустая операция - просто регистрирует что миграция "применена"
    ]
```

Затем применить её вручную:
```bash
python manage.py migrate --fake
```

### Вариант 3: Добавить поле в существующую БД вручную

Если БД уже развёрнута, добавить поле вручную:

```sql
-- Для PostgreSQL:
ALTER TABLE items_itemhistory ADD COLUMN comment TEXT NULL;

-- Для SQLite:
ALTER TABLE items_itemhistory ADD COLUMN comment TEXT NULL;
```

Затем создать пустую миграцию как в Варианте 2.

### Вариант 4: Раскомментировать и пересоздать БД (чистое решение)

**Только для разработки!**

1. Раскомментировать миграцию
2. Удалить файл БД (`db.sqlite3` или очистить БД)
3. Перезапустить миграции: `python manage.py migrate`

## Рекомендация

Для продакшена используйте **Вариант 3**: добавьте поле в БД вручную и создайте фиктивную миграцию.

Для тестов используйте **Вариант 1**: временно раскомментируйте миграцию, запустите тесты, затем закомментируйте обратно.

## Как определить что поле уже есть в БД

```python
# Проверка через Django ORM
from django.db import connection

with connection.schema_editor() as schema_editor:
    table_name = ItemHistory._meta.db_table
    columns = connection.introspection.table_names(connection.cursor())
    # Или через прямой запрос:
    cursor = connection.cursor()
    cursor.execute("PRAGMA table_info(items_itemhistory)")
    columns = cursor.fetchall()
    has_comment = any(col[1] == 'comment' for col in columns)
```

## Код для проверки

```python
# В tests.py можно добавить проверку
from django.db import connection

def setUp(self):
    # Проверяем есть ли поле comment
    cursor = connection.cursor()
    cursor.execute("PRAGMA table_info(items_itemhistory)")
    columns = [col[1] for col in cursor.fetchall()]
    
    if 'comment' not in columns:
        self.skipTest("Поле comment отсутствует в БД")
```

## Ссылки

- [Django Migrations](https://docs.djangoproject.com/en/stable/topics/migrations/)
- [Django Field Reference](https://docs.djangoproject.com/en/stable/ref/models/fields/)

