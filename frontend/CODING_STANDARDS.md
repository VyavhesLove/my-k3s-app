# Стандарты разработки Frontend

# Нельзя запускать npm run test:run - это "кладет" сервер!

## 1. Использование Zustand для управления состоянием

### Всегда используйте Zustand вместо локального состояния useState

**❌ Неправильно:**
```jsx
function MyComponent() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    loadItems();
  }, [...]);
  
  const handleSearch = async (query) => {
    // прямой запрос к API
  };
  // ...
}
```

**✅ Правильно:**
```jsx
// Использовать централизованный store
function MyComponent() {
  const { items, loading, refreshItems, searchItems } = useItemStore();
  // ...
}
```

### Почему это важно

1. **Избегание конфликтов** - нет конфликта между useEffect и обработчиками событий
2. **Централизованное управление** - всё состояние в одном месте
3. **Производительность** - меньше перерисовок
4. **Переиспользуемость** - store можно использовать в нескольких компонентах

---

## 2. Структура Zustand Store

### Обязательные элементы store

```js
import { create } from 'zustand';
import api from '@/api/axios';

export const useItemStore = create((set, get) => ({
  // Состояние
  items: [],
  itemsLoading: false,
  
  // Основные методы
  refreshItems: async () => {
    set({ itemsLoading: true });
    try {
      const response = await api.get('/items');
      // Универсальный парсер ответа
      let itemsArray = [];
      if (response.data?.data?.items) {
        itemsArray = response.data.data.items;
      } else if (response.data?.items) {
        itemsArray = response.data.items;
      }
      set({ items: itemsArray, itemsLoading: false });
    } catch (err) {
      set({ items: [], itemsLoading: false });
    }
  },

  searchItems: async (query) => {
    set({ itemsLoading: true });
    try {
      const response = await api.get(`/items?search=${query}`);
      // Парсинг ответа...
      set({ items: itemsArray, itemsLoading: false });
    } catch (err) {
      set({ items: [], itemsLoading: false });
    }
  },

  // Точечное обновление
  updateItemLocally: (updatedItem) => {
    const { items } = get();
    const index = items.findIndex(i => i.id === updatedItem.id);
    if (index !== -1) {
      const newItems = [...items];
      newItems[index] = { ...newItems[index], ...updatedItem };
      set({ items: newItems });
    }
  },

  // Добавление в начало
  addItemToTop: (newItem) => {
    const { items } = get();
    set({ items: [newItem, ...items] });
  },

  // Удаление
  removeItemFromList: (itemId) => {
    const { items } = get();
    set({ items: items.filter(i => i.id !== itemId) });
  },

  // Полный сброс
  reset: () => set({
    items: [],
    itemsLoading: false,
  }),
}));
```

---

## 3. Паттерн использования в компонентах

### Основные правила

1. **Не создавать локальное состояние** для данных, которые приходят с API
2. **Использовать методы из store** для всех операций (поиск, фильтрация, пагинация)
3. **Не делать прямые запросы в useEffect** - использовать методы store

**✅ Правильно:**
```jsx
import { useItemStore } from '@/store/useItemStore';

function ItemsList() {
  const { items, itemsLoading, refreshItems, searchItems } = useItemStore();
  
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      refreshItems();
    }
  }, []);

  const handleSearch = useCallback((query) => {
    if (query.trim()) {
      searchItems(query);
    } else {
      refreshItems();
    }
  }, [searchItems, refreshItems]);

  return (
    // ...
  );
}
```

**❌ Неправильно:**
```jsx
function ItemsList() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const loadItems = async () => { /* ... */ };
  
  useEffect(() => {
    loadItems();  // Конфликт с handleSearch!
  }, [searchQuery]);  // При изменении searchQuery - перезагрузка!

  const handleSearch = async (query) => {
    setSearchQuery(query);
    // Прямой запрос к API
    const response = await api.get(`/items?search=${query}`);
    setItems(response.data.items);
  };
  // ...
}
```

---

## 4. Название файлов Store

- Использовать префикс `use` - `useItemStore.js`, `useUserStore.js`
- Хранить в папке `/src/store/`

---

## 5. Работа с API

### Всегда использовать централизованный axios

```js
import api from '@/api/axios';

// Правильно
const response = await api.get('/endpoint');

// Не создавать новые экземпляры axios
```

### Универсальный парсинг ответа API

```js
// Всегда обрабатывать разные форматы ответов
let itemsArray = [];

// Вариант 1: { success: true, data: { items: [...] } }
if (response.data?.data?.items && Array.isArray(response.data.data.items)) {
  itemsArray = response.data.data.items;
}
// Вариант 2: { success: true, data: [...] }
else if (response.data?.data && Array.isArray(response.data.data)) {
  itemsArray = response.data.data;
}
// Вариант 3: { items: [...] }
else if (response.data?.items && Array.isArray(response.data.items)) {
  itemsArray = response.data.items;
}
// Вариант 4: прямой массив
else if (Array.isArray(response.data)) {
  itemsArray = response.data;
}
```

---

## 6. Чек-лист перед коммитом

- [ ] Используется Zustand store для управления состоянием
- [ ] Нет конфликта между useEffect и обработчиками событий
- [ ] Используется централизованный axios
- [ ] Нет прямых запросов в useEffect
- [ ] Методы store покрывают все операции (CRUD, поиск, фильтрация)

