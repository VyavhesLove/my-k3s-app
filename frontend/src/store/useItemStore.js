import { create } from 'zustand';

export const useItemStore = create((set) => ({
  // Состояние выбранного ТМЦ
  selectedItem: null,
  setSelectedItem: (item) => set({ selectedItem: item }),

  // Состояние модалки сервиса
  isServiceModalOpen: false,
  serviceMode: 'send', // 'send', 'confirm' или 'return'
  
  // Экшены для управления модалкой
  openServiceModal: (mode) => set({ 
    isServiceModalOpen: true, 
    serviceMode: mode 
  }),
  closeServiceModal: () => set({ 
    isServiceModalOpen: false 
  }),
}));