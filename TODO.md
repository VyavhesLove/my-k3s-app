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

