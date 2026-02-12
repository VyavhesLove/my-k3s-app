# TODO: API для WriteOffs

## Задачи

### 1. Создать сериализатор WriteOffCreateSerializer
- [ ] Добавить WriteOffCreateSerializer в items/serializers.py

### 2. Создать Query слой для списка writeoffs
- [ ] Создать ListWriteOffsQuery в items/services/queries/

### 3. Создать API views для writeoffs
- [ ] Создать write_off_list (GET /writeoffs/)
- [ ] Создать write_off_create (POST /writeoffs/)
- [ ] Создать write_off_cancel (POST /writeoffs/{id}/cancel/)
- [ ] Добавить permission_classes [IsStorekeeper]

### 4. Добавить URL endpoints
- [ ] Добавить path('writeoffs/', views.write_off_list, name='write_off_list')
- [ ] Добавить path('writeoffs/<int:write_off_id>/cancel/', views.write_off_cancel, name='write_off_cancel')

### 5. Создать API тесты
- [ ] Создать файл backend/tests/test_api/test_writeoffs.py
- [ ] Написать тесты для storekeeper (успешные операции)
- [ ] Написать тесты для foreman (403)
- [ ] Написать тесты для anonymous (401)
- [ ] Написать тесты для фильтрации (status, location, date)

## Выполнено

### Проверка тестов
- [ ] source venv/bin/activate && python manage.py test tests.test_api.test_writeoffs

