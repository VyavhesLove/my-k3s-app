import { create } from 'zustand';
import api from '../api/axios';
import { toast } from 'sonner';
import { logger } from '../utils/logger';

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
      // 🔥 Логи ТОЛЬКО в development
      logger.group('📦 Загрузка ТМЦ');
      logger.log('URL:', response.config.url);
      logger.log('Status:', response.status);
      logger.log('Response:', response.data);
      logger.groupEnd();
      
      // ✅ УНИВЕРСАЛЬНЫЙ ПАРСЕР - ВСЕГДА ВОЗВРАЩАЕТ МАССИВ
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
      // Вариант 5: { data: [...] } (без success)
      else if (response.data?.data && Array.isArray(response.data.data)) {
        itemsArray = response.data.data;
      }
      
      // ✅ УСПЕХ - показываем только если реально загрузили
      if (itemsArray.length > 0) {
        toast.success(`✅ Загружено ${itemsArray.length} ТМЦ`, {
          duration: 3000, // 3 секунды
        });
        // Лог только в dev
        logger.info(`Загружено ${itemsArray.length} ТМЦ`);
      }
      
      // ✅ КРИТИЧЕСКИ ВАЖНО: ВСЕГДА УСТАНАВЛИВАЕМ МАССИВ!
      set({ 
        items: itemsArray,
        itemsLoading: false 
      });
    } catch (err) {
      // Ошибки логируем всегда
      logger.group('❌ Ошибка загрузки ТМЦ');
      logger.error('Message:', err.message);
      logger.error('Status:', err.response?.status);
      logger.error('Data:', err.response?.data);
      logger.groupEnd();
      
      // ❌ ОШИБКА - понятное сообщение пользователю
      toast.error('❌ Не удалось загрузить список ТМЦ', {
        description: err.response?.status === 401 
          ? 'Сессия истекла. Войдите снова.' 
          : 'Проверьте подключение к серверу',
        duration: 5000,
      });
      
      set({ 
        items: [],  // ← Пустой массив при ошибке
        itemsLoading: false 
      });
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
      
      // ✅ УВЕДОМЛЕНИЕ О БЛОКИРОВКЕ
      toast.info('🔒 ТМЦ заблокирован', {
        description: 'Вы можете редактировать',
        duration: 2000,
      });
      
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
        
        // ⚠️ УЖЕ ЗАБЛОКИРОВАНО
        toast.warning('🔒 ТМЦ уже заблокирован', {
          description: `Пользователем: ${lockInfo.locked_by || 'Неизвестный'}`,
          duration: 4000,
        });
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
      
      // ✅ УВЕДОМЛЕНИЕ О РАЗБЛОКИРОВКЕ
      toast.success('🔓 ТМЦ разблокирован', {
        duration: 2000,
      });
      
    } catch (err) {
      // Ошибки логируем всегда
      logger.group('❌ Ошибка разблокировки');
      logger.error('Message:', err.message);
      logger.error('Status:', err.response?.status);
      logger.groupEnd();
      
      // ❌ ОШИБКА РАЗБЛОКИРОВКИ
      toast.error('❌ Не удалось разблокировать', {
        description: 'Попробуйте позже',
      });
      
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
