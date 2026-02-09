import { create } from 'zustand';

export const useItemStore = create((set) => ({
  // Состояние выбранного ТМЦ
  selectedItem: null,
  setSelectedItem: (item) => set({ selectedItem: item }),

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
