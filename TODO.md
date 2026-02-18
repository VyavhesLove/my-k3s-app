# TODO: Настройка admin.py для логов ошибок

## План

### 1. Обновить модель ErrorLog в items/models.py
- [x] Добавить поле `resolved = models.BooleanField(default=False, verbose_name="Исправлено")`
- [x] Проверить/изменить тип поля `stack_trace` на `TextField` (уже был TextField)

### 2. Обновить admin.py в items/admin.py
- [x] Изменить list_display: добавить resolved_status
- [x] Добавить list_filter: resolved
- [x] Добавить list_editable: resolved
- [x] Добавить exclude для stack_trace
- [x] Создать метод resolved_status (цветная метка)
- [x] Создать метод short_message
- [x] Создать метод stack_trace_formatted (стилизованный <pre>)

### 3. Создать миграцию БД
- [ ] **Требуется выполнить**: `python manage.py makemigrations items`

### 4. Проверить работу
- [ ] Запустить тесты (source venv/bin/activate && python manage.py test)

