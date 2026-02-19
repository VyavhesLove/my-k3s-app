# План: Исправление проверки прав доступа

## Задача
Убрать проверку прав доступа на основе `localStorage`, использовать защищённый API `/api/users/me/` для получения роли.

## Выполненные шаги:

### ✅ 1. Frontend - Создание хука useUserRole
- [x] Создать `my-k3s-app/frontend/src/hooks/useUserRole.js` для централизованного получения роли с бэкенда
- [x] Хук загружает роль с `/api/users/me/` и синхронизирует с localStorage

### ✅ 2. Frontend - Обновление App.jsx
- [x] Импортировать и использовать хук `useUserRole`
- [x] Использовать роль из хука (`isAdmin`) для UI отображения
- [x] Убрать старую зависимость от `localStorage.getItem('userRole')` для проверки доступа

### ✅ 3. Frontend - Обновление Sidebar.jsx
- [x] Использовать хук `useUserRole` для определения видимости пункта "Администрирование"
- [x] Передавать `isAdmin` в SidebarMenu

### ✅ 4. Frontend - Обновление SidebarMenu.jsx
- [x] Принимать проп `isAdmin`
- [x] Показывать пункт меню "Администрирование" только для админов

### ✅ 5. Frontend - LoginPage.jsx
- [x] Уже правильно сохраняет роль с защищённого API при логине

### ⏳ 6. Backend - Проверка защиты API
- [ ] Требует отдельной задачи - многие endpoints используют AllowAny
- [ ] Для админских операций используются permissions: IsStorekeeper, IsAdmin

