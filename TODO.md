# План рефакторинга ItemTransfer.jsx в модальное окно

## Задачи:
1. ✅ Создать TransferModal.jsx в папке modals
2. ✅ Обновить useItemStore.js - добавить состояние для модалки передачи
3. ✅ Обновить App.jsx - убрать маршрут /transfer, удалить импорт ItemTransfer
4. ✅ Обновить ItemDetailPanel.jsx - добавить рендер TransferModal (кнопка "Передать ТМЦ" здесь)
5. ✅ Обновить App.jsx - handleOpenServiceModal обрабатывает mode === 'transfer'
6. ✅ Удалить старую страницу ItemTransfer.jsx

## Детали реализации:
- Модальное окно следует паттерну ServiceModal (fixed inset-0, backdrop-blur)
- Использует zustand store для управления состоянием
- Логика загрузки локаций и отправки формы сохранена
- Кнопка "Передать ТМЦ" находится в ItemDetailPanel и открывает модалку

---

# TODO: ItemTransitions.reject() - поиск по частичному совпадению

## Задача:
- В файле `history_service.py` метод `get_first_assignment` использует точное сравнение `action_type=HistoryAction.ASSIGNED.value`
- Если поиск не находит записи, заменить на `action__icontains=HistoryAction.ASSIGNED.value`
- Поиск по частичному совпадению в поле `action` (не `action_type`)

## Расположение кода:
- Файл: `my-k3s-app/backend/items/services/history_service.py`
- Метод: `get_first_assignment`
- Комментарий с TODO уже добавлен в код

