import { useEffect } from 'react';
import { useUserRoleStore } from '@/store/useUserRoleStore';

/**
 * Хук для централизованного получения роли пользователя с бэкенда.
 * Теперь использует Zustand store для избежания race conditions.
 * 
 * Использование:
 * - role: текущая роль пользователя ('admin', 'storekeeper', 'foreman', 'user')
 * - isAdmin: boolean - является ли пользователь админом
 * - isLoading: boolean - идёт ли загрузка
 * - error: string | null - ошибка при загрузке
 * - refreshRole(): функция для принудительного обновления роли
 */
const useUserRole = () => {
  const store = useUserRoleStore();
  
  // ✅ Критически важно: вызываем fetchRole при монтировании если есть токен
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token && !store.isLoading) {
      // Если роль ещё не загружена (значение по умолчанию) - загружаем с сервера
      const currentRole = localStorage.getItem('userRole');
      if (!currentRole || currentRole === 'user') {
        store.fetchRole();
      }
    }
  }, []);

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

export default useUserRole;

