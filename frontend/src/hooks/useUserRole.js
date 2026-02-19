import { useState, useEffect, useCallback } from 'react';
import api from '@/api/axios';

/**
 * Хук для централизованного получения роли пользователя с бэкенда.
 * 
 * Использование:
 * - role: текущая роль пользователя ('admin', 'storekeeper', 'foreman', 'user')
 * - isAdmin: boolean - является ли пользователь админом
 * - isLoading: boolean - идёт ли загрузка
 * - error: string | null - ошибка при загрузке
 * - refreshRole(): функция для принудительного обновления роли
 */
const useUserRole = () => {
  const [role, setRole] = useState(() => localStorage.getItem('userRole') || 'user');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchRole = useCallback(async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      setRole('user');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      // Получаем данные пользователя с защищённого API
      const response = await api.get('/users/me/');
      const userData = response.data;
      
      // Роль из надёжного источника - бэкенда
      const userRole = userData.role || 'user';
      
      setRole(userRole);
      
      // Синхронизируем с localStorage для совместимости
      localStorage.setItem('userRole', userRole);
      localStorage.setItem('user', JSON.stringify(userData));
      
    } catch (err) {
      console.error('Ошибка при загрузке роли пользователя:', err);
      setError('Не удалось загрузить роль');
      
      // При ошибке используем значение по умолчанию
      setRole('user');
      localStorage.setItem('userRole', 'user');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Загружаем роль при монтировании
  useEffect(() => {
    fetchRole();
  }, [fetchRole]);

  // Вычисляемые значения
  const isAdmin = role === 'admin';
  const isStorekeeper = role === 'storekeeper';
  const isForeman = role === 'foreman';

  return {
    role,
    isAdmin,
    isStorekeeper,
    isForeman,
    isLoading,
    error,
    refreshRole: fetchRole,
  };
};

export default useUserRole;

