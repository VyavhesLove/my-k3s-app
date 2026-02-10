import { create } from 'zustand';
import api from '../api/axios';

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
}));
