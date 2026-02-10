import { create } from 'zustand';
import api from '../api/axios';
import { toast } from 'sonner';

export const useItemStore = create((set, get) => ({
  // Состояние выбранного ТМЦ
  selectedItem: null,
  setSelectedItem: (item) => set({ selectedItem: item }),

  // === СПИСОК ТМЦ (Централизованное управление) ===
  items: [],
  itemsLoading: false,
  
  // Универсальная функция обновления списка ТМЦ
  refreshItems: async () => {
    set({ itemsLoading: true });
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        set({ itemsLoading: false });
        return;
      }
      
      const response = await api.get('/items');
      set({ 
        items: response.data.items || [],
        itemsLoading: false 
      });
    } catch (err) {
      console.error('Ошибка обновления списка ТМЦ:', err);
      set({ itemsLoading: false });
    }
  },

  // Точечное обновление одного ТМЦ в списке
  updateItemLocally: (updatedItem) => {
    const { items } = get();
    const index = items.findIndex(i => i.id === updatedItem.id);
    if (index !== -1) {
      const newItems = [...items];
      newItems[index] = { ...newItems[index], ...updatedItem };
      set({ items: newItems });
    }
  },

  // Добавление нового ТМЦ в начало списка
  addItemToTop: (newItem) => {
    const { items } = get();
    set({ items: [newItem, ...items] });
  },

  // Удаление ТМЦ из списка
  removeItemFromList: (itemId) => {
    const { items } = get();
    set({ items: items.filter(i => i.id !== itemId) });
  },

  // === БЛОКИРОВКА ТМЦ ===
  // Словарь заблокированных ТМЦ: { itemId: { user: 'Имя', time: 'ISO время' } }
  lockedItems: {},

  // Заблокировать ТМЦ
  lockItem: async (itemId) => {
    try {
      const response = await api.post(`/items/${itemId}/lock/`);
      
      // Успешная блокировка
      const username = response.data.locked_by || 'Текущий пользователь';
      
      set((state) => ({
        lockedItems: {
          ...state.lockedItems,
          [itemId]: { 
            user: username, 
            time: new Date().toISOString() 
          }
        }
      }));
      
      return response.data;
    } catch (err) {
      // Если уже заблокировано другим пользователем (423)
      if (err.response?.status === 423) {
        const lockInfo = err.response.data;
        set((state) => ({
          lockedItems: {
            ...state.lockedItems,
            [itemId]: { 
              user: lockInfo.locked_by || 'Неизвестный', 
              time: lockInfo.locked_at || new Date().toISOString()
            }
          }
        }));
      }
      throw err;
    }
  },

  // Разблокировать ТМЦ
  unlockItem: async (itemId) => {
    try {
      await api.post(`/items/${itemId}/unlock/`);
      
      set((state) => {
        const newLocked = { ...state.lockedItems };
        delete newLocked[itemId];
        return { lockedItems: newLocked };
      });
    } catch (err) {
      console.error('Ошибка разблокировки:', err);
      throw err;
    }
  },

  // Проверить и обновить статус блокировки
  checkAndUpdateLock: async (itemId) => {
    try {
      // Пытаемся заблокировать - если уже заблокировано, получим 423
      await api.post(`/items/${itemId}/lock/`);
    } catch (err) {
      if (err.response?.status === 423) {
        const lockInfo = err.response.data;
        set((state) => ({
          lockedItems: {
            ...state.lockedItems,
            [itemId]: { 
              user: lockInfo.locked_by || 'Неизвестный', 
              time: lockInfo.locked_at || new Date().toISOString()
            }
          }
        }));
      }
    }
  },

  // === МОДАЛКИ ===
  
  // Состояние модалки сервиса
  isServiceModalOpen: false,
  serviceMode: 'send', // 'send', 'confirm' или 'return'
  
  // Экшены для управления модалкой сервиса
  openServiceModal: (mode) => set({ 
    isServiceModalOpen: true, 
    serviceMode: mode 
  }),
  closeServiceModal: () => set({ 
    isServiceModalOpen: false 
  }),

  // Состояние модалки передачи ТМЦ
  isTransferModalOpen: false,
  
  // Экшены для управления модалкой передачи
  openTransferModal: () => set({ 
    isTransferModalOpen: true 
  }),
  closeTransferModal: () => set({ 
    isTransferModalOpen: false 
  }),

  // === МОДАЛКА ПОДТВЕРЖДЕНИЯ ТМЦ ===
  // Состояние модалки подтверждения ТМЦ
  isConfirmTMCModalOpen: false,

  // Экшены для управления модалкой подтверждения ТМЦ
  openConfirmTMCModal: () => set({ 
    isConfirmTMCModalOpen: true 
  }),
  closeConfirmTMCModal: () => set({ 
    isConfirmTMCModalOpen: false 
  }),
}));
