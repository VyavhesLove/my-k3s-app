import { create } from 'zustand';
import api from '@/api/axios';

/**
 * Zustand store для управления ролью пользователя.
 * Используется вместо хука useUserRole для избежания race conditions
 * и множественных вызовов API при рендере.
 */
export const useUserRoleStore = create((set, get) => ({
  // === СОСТОЯНИЕ ===
  role: localStorage.getItem('userRole') || 'user',
  error: null,

  // === МЕТОДЫ ===

  /**
   * Загружает роль пользователя с бэкенда
   */
  fetchRole: async () => {
    const token = localStorage.getItem('accessToken');
    
    if (!token) {
      set({ role: 'user', isLoading: false, error: null });
      return;
    }

    try {
      set({ isLoading: true, error: null });

      // Получаем данные пользователя с защищённого API
      const response = await api.get('/users/me/');
      const userData = response.data;

      // Роль из надёжного источника - бэкенда
      const userRole = userData.role || 'user';

      // Синхронизируем с localStorage для совместимости
      localStorage.setItem('userRole', userRole);
      localStorage.setItem('user', JSON.stringify(userData));

      set({ role: userRole, isLoading: false, error: null });

      console.log('[useUserRoleStore] Роль пользователя обновлена:', userRole);

    } catch (err) {
      console.error('Ошибка при загрузке роли пользователя:', err);
      
      // При ошибке используем значение по умолчанию
      set({ role: 'user', isLoading: false, error: 'Не удалось загрузить роль' });
      localStorage.setItem('userRole', 'user');
    }
  },

  /**
   * Принудительное обновление роли
   */
  refreshRole: () => {
    get().fetchRole();
  },

  /**
   * Вычисляемые значения (геттеры)
   */
  getIsAdmin: () => get().role === 'admin',
  getIsStorekeeper: () => get().role === 'storekeeper',
  getIsForeman: () => get().role === 'foreman',

  /**
   * Сброс состояния при выходе
   */
  reset: () => {
    set({
      role: 'user',
      isLoading: false,
      error: null,
    });
  },
}));

/**
 * Хук-обёртка для обратной совместимости с useUserRole
 * Рекомендуется использовать useUserRoleStore напрямую в новом коде
 */
export const useUserRole = () => {
  const store = useUserRoleStore();
  
  return {
    role: store.role,
    isAdmin: store.getIsAdmin(),
    isStorekeeper: store.getIsStorekeeper(),
    isForeman: store.getIsForeman(),
    isLoading: store.isLoading,
    error: store.error,
    refreshRole: store.refreshRole,
  };
};

