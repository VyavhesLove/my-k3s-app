# TODO: Рефакторинг user в ItemHistory

## Задача
Не смешивать user как объект и user.username как строку в ItemHistory.

## Шаги

### 1. services.py - Исправить ConfirmTMCService._reject() ✓
- [x] Исправить строку `item.responsible = first_operation.user.username if first_operation.user else first_operation.user`
- [x] Правильно обрабатывать FK: `first_operation.user.username` если FK существует, иначе None

### 2. serializers.py - Обновить HistorySerializer ✓
- [x] Добавить `user_username` поле с SerializerMethodField
- [x] Добавить все необходимые поля: id, action, timestamp, user, user_username, location, comment
- [x] Обновить ItemSerializer для использования нового HistorySerializer

### 3. frontend - Обновить ItemDetailPanel.jsx ✓
- [x] Использовать `h.user_username` для отображения username
- [x] Добавить fallback на `h.user` и `-` если данных нет

### 4. Проверка
- [ ] Запустить тесты (если есть)
- [ ] Проверить что history отображается корректно на фронтенде

