# TODO: Исправление поиска в таблице пользователей

## Проблемы

1. **Поиск по имени и фамилии не работает** - Backend не обрабатывает `first_name` и `last_name` как отдельные поля
2. **Двойной debounce** - 300ms в TableHeader + 300ms в useUsers = ~600ms задержка
3. **Проблема с регистром** - Frontend принудительно делает `toLowerCase()`, что может влиять на поиск

---

## План исправления

### 1. Исправить backend (`backend/users/views.py`)

**Задача:** Добавить обработку `first_name` и `last_name` в условие поиска

```python
# Изменить:
elif search_field in ['username', 'email']:

# На:
elif search_field in ['username', 'email', 'first_name', 'last_name']:
```

**Также убрать `.lower()` в поиске (icontains уже регистронезависимый):**

```python
# Было:
Q(first_name__icontains=search.lower())

# Стало:
Q(first_name__icontains=search)
```

---

### 2. Убрать двойной debounce

**Вариант А: Оставить debounce только в TableHeader**

- В `useUsers.js` убрать debounce для текстовых полей (`first_name`, `last_name`, `username`, `email`)
- Debounce уже есть в `TableHeader.jsx` (300ms)

**Вариант Б: Оставить debounce только в useUsers**

- В `TableHeader.jsx` убрать debounce, вызывать `handleFilterChange` напрямую
- Debounce уже есть в `useUsers.js` (300ms)

**Рекомендуется: Вариант А** - TableHeader уже имеет локальное состояние `localValue` для предотвращения потери фокуса

---

### 3. Убрать принудительный toLowerCase() на фронте

**В файле `useUsers.js`:**

```javascript
// Было:
if (search && search.trim().length > 0) {
  urlParams.append('search', search.trim().toLowerCase());
}

// Стало:
if (search && search.trim().length > 0) {
  urlParams.append('search', search.trim());
}
```

**В функции `handleFilterChange`:**

```javascript
// Было:
const newFilters = key === 'role' ? value : (value ? value.toLowerCase() : '');

// Стало:
const newFilters = key === 'role' ? value : (value ? value : '');
```

---

## Файлы для изменения

1. `backend/users/views.py` - добавить first_name/last_name в условие, убрать .lower()
2. `frontend/src/pages/UsersList/hooks/useUsers.js` - убрать toLowerCase(), убрать двойной debounce
3. `frontend/src/components/inventory/TableHeader.jsx` - возможно убрать debounce (если выбран вариант А)

---

## Порядок выполнения

1. ✅ Анализ проведён
2. ✅ Исправлен backend (`users/views.py`) - добавлено first_name/last_name, убран .lower()
3. ✅ Исправлен frontend (`useUsers.js`, `useUserStore.js`) - убран toLowerCase и двойной debounce, добавлена синхронизация с store
4. ⬜ Протестировать

