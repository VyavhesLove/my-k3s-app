# Рефакторинг AtWorkPage в модальное окно

## План работ:

### 1. Создать AtWorkModal.jsx
- [x] Создать файл в my-k3s-app/frontend/src/components/modals/AtWorkModal.jsx
- [x] Преобразовать компонент страницы в модальное окно
- [x] Добавить оверлей с backdrop-blur и z-index
- [x] Сохранить логику работы с бригадами и выдачей ТМЦ

### 2. Обновить useItemStore.js
- [x] Добавить состояние isAtWorkModalOpen
- [x] Добавить экшен openAtWorkModal()
- [x] Добавить экшен closeAtWorkModal()

### 3. Обновить App.jsx
- [x] Убрать импорт AtWorkPage
- [x] Убрать маршрут /at-work
- [x] Добавить отображение AtWorkModal (как ServiceModal)

### 4. Удалить старый файл
- [x] Удалить my-k3s-app/frontend/src/components/AtWorkPage.jsx

## Примечание:
- BrigadeModal.jsx оставить (не удалять)
- QuickActions.jsx не изменять

## Статус: ВЫПОЛНЕНО ✓

