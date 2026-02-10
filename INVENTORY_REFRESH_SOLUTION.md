# Решение для принудительного обновления списка ТМЦ

## Проблема
После выполнения действий в модальных окнах (передача ТМЦ, отправка в сервис, подтверждение ремонта, в работу) список ТМЦ не обновлялся автоматически. В `ServiceModal.jsx` использовался `window.location.reload()` - плохая практика.

## Решение на основе Zustand

### 1. Расширен Zustand Store (`useItemStore.js`)

```javascript
// Новое состояние для централизованного управления списком
items: [],
itemsLoading: false,

// Универсальная функция обновления всего списка
refreshItems: async () => {
  set({ itemsLoading: true });
  try {
    const response = await api.get('/items');
    set({ items: response.data.items || [], itemsLoading: false });
  } catch (err) {
    console.error('Ошибка обновления списка ТМЦ:', err);
    set({ itemsLoading: false });
  }
},

// Точечное обновление одного ТМЦ
updateItemLocally: (updatedItem) => {
  const { items } = get();
  const index = items.findIndex(i => i.id === updatedItem.id);
  if (index !== -1) {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], ...updatedItem };
    set({ items: newItems });
  }
}
```

### 2. Обновлен `InventoryList.jsx`

- Использует `items` из Zustand store вместо локального состояния
- Вызывает `refreshItems()` при монтировании
- Автоматически обновляется при изменении данных в store

### 3. Обновлены модальные окна

#### AtWorkModal.jsx
```javascript
// После успешной операции:
const { refreshItems, setSelectedItem } = useItemStore.getState();
await refreshItems();
setSelectedItem(null);
```

#### TransferModal.jsx  
```javascript
// В success callback toast.promise:
const { refreshItems, setSelectedItem } = useItemStore.getState();
refreshItems();
setSelectedItem(null);
```

#### ServiceModal.jsx
```javascript
// Заменено window.location.reload() на:
const { refreshItems, setSelectedItem } = useItemStore.getState();
await refreshItems();
setSelectedItem(null);
```

#### ItemCreate.jsx
```javascript
// При создании нового ТМЦ:
refreshItems();
```

## Преимущества решения

1. **Централизованное управление** - состояние списка в одном месте
2. **Автоматическое обновление** - все компоненты, использующие `items` из store, обновляются автоматически
3. **Нет prop drilling** - не нужно передавать callback-функции через пропсы
4. **Мгновенное обновление** - без перезагрузки страницы
5. **Единообразие** - одинаковый подход для всех модальных окон

## Использование в будущем

Для добавления новых действий с ТМЦ:

```javascript
// В любом компоненте/модалке:
import { useItemStore } from '../store/useItemStore';

const MyNewModal = () => {
  const { refreshItems } = useItemStore();
  
  const handleAction = async () => {
    await api.post(`/items/${itemId}/new-action/`);
    await refreshItems(); // Список обновится автоматически!
  };
};
```

## Архитектурная схема

```
┌─────────────────────────────────────────────────────────────┐
│                      Zustand Store                          │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  items: []                                          │   │
│  │  itemsLoading: false                                │   │
│  │  refreshItems() → fetch API → set({ items })       │   │
│  └─────────────────────────────────────────────────────┘   │
│                              ↑                             │
│         ┌────────────────────┼────────────────────┐       │
│         │                    │                    │       │
│    ┌────┴────┐          ┌────┴────┐          ┌────┴────┐   │
│    │Inventory│          │ AtWork  │          │Service  │   │
│    │ List    │          │ Modal   │          │ Modal   │   │
│    │ (read)  │          │ (write) │          │ (write) │   │
│    └─────────┘          └─────────┘          └─────────┘   │
│                                                          │
└─────────────────────────────────────────────────────────────┘
```

## Файлы измененные в рамках решения

1. `frontend/src/store/useItemStore.js` - добавлено централизованное управление списком
2. `frontend/src/components/InventoryList.jsx` - интеграция с Zustand store
3. `frontend/src/components/modals/AtWorkModal.jsx` - вызов refreshItems после операции
4. `frontend/src/components/modals/TransferModal.jsx` - вызов refreshItems после операции
5. `frontend/src/components/modals/ServiceModal.jsx` - заменен window.location.reload()
6. `frontend/src/components/ItemCreate.jsx` - вызов refreshItems после создания

Архитектура блокировок:
PUT/PATCH /items/<id>/
    │
    ├──► ItemLockService.lock_item(id, user)
    │         └──► SELECT FOR UPDATE
    │         └──► Проверка: already locked?
    │         └──► Сохранение locked_by/locked_at
    │
    ├──► ItemSerializer → save()
    │         └──► Обновление полей
    │
    ├──► ItemHistory.create() (если есть comment)
    │
    └──► ItemLockService.unlock_item(id, user)
              └──► Очистка locked_by/locked_at
