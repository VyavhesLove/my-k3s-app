# TODO: Рефакторинг ItemHistory — структурированные данные

## Задача
Разделить историю (для человека) и структурированные данные (для системы).

## Шаги

### 1. Обновить models.py ✓
- [x] `ItemHistory.user` → ForeignKey на User (nullable)
- [x] `ItemHistory.location` → ForeignKey на Location (nullable)

### 2. Обновить services.py ✓
- [x] `ConfirmTMCService._accept()` — сохранять user и location как FK
- [x] `ConfirmTMCService._reject()` — убрать парсинг строки, использовать FK поля
- [x] `ItemLockService.lock_item()` — обновить создание ItemHistory
- [x] `ItemServiceService.send_to_service()` — обновить создание ItemHistory

### 3. Обновить views.py ✓
- [x] `send_to_service()` — добавить location FK
- [x] `return_from_service()` — добавить user/location FK
- [x] `confirm_repair()` — добавить user/location FK
- [x] `confirm_item()` — добавить user/location FK
- [x] `item_detail()` — добавить user/location FK

### 4. Обновить admin.py ✓
- [x] Добавить отображение новых полей user и location

### 5. Создать миграцию (пользователь сделает сам)
```bash
python manage.py makemigrations items
```

