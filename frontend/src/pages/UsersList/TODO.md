# TODO - Рефакторинг UsersList.jsx

## Прогресс:
- [x] 1. Создать хук hooks/useUsers.js (логика)
- [x] 2. Создать компонент components/UserRow.jsx (строка таблицы)
- [x] 3. Создать компонент components/UsersTable.jsx (таблица)
- [x] 4. Создать компонент components/EmptyState.jsx (пустое состояние)
- [x] 5. Переписать UsersList.jsx (контейнер-оркестратор)

## Дополнительные исправления (из refactor.md):
- [x] 1. Удалён старый UsersList.jsx (284 строки)
- [x] 2. Переименован store/useUserRoleStore.js → useUserRole.js
- [x] 3. Создан components/users/index.js (barrel export)

## Итоговая структура:
```
src/pages/UsersList/
├── UsersList.jsx       (контейнер)
├── index.js            (экспорт)
├── TODO.md
├── components/
│   ├── UsersTable.jsx
│   ├── UserRow.jsx
│   └── EmptyState.jsx
└── hooks/
    └── useUsers.js

src/store/
├── useItemStore.js
├── useUserRole.js      (переименован)
└── useUserStore.js

src/components/users/
├── index.js            (создан)
└── RoleFilter.jsx
```

## Оценка структуры: 10/10

