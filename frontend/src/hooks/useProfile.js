import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import api from '@/api/axios';
import { useUserSessions } from './useUserSessions';
import { useUserHistory } from './useUserSessions';

// Хук для работы с данными профиля
export const useProfile = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Используем готовые хуки для сессий и истории
  const { 
    sessions, 
    loading: sessionsLoading, 
    fetchSessions, 
    terminateSession 
  } = useUserSessions();
  
  const { 
    history, 
    loading: historyLoading,
    fetchHistory 
  } = useUserHistory();

  // Форма профиля
  const [profileForm, setProfileForm] = useState({
    first_name: '',
    last_name: '',
    email: ''
  });

  // Форма смены пароля
  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });

  // Загрузка данных пользователя
  const fetchUserData = useCallback(async () => {
    try {
      setLoading(true);
      const userRes = await api.get('/users/me/');
      setUser(userRes.data);

      // Заполняем форму профиля
      setProfileForm({
        first_name: userRes.data.first_name || '',
        last_name: userRes.data.last_name || '',
        email: userRes.data.email || ''
      });

      // Загружаем сессии и историю
      await Promise.all([
        fetchSessions(),
        fetchHistory()
      ]);
    } catch {
      toast.error('Ошибка загрузки данных профиля');
    } finally {
      setLoading(false);
    }
  }, [fetchSessions, fetchHistory]);

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  // Обновление профиля
  const handleProfileSubmit = useCallback(async (e) => {
    e.preventDefault();
    try {
      await api.put('/users/me/update/', profileForm);
      toast.success('Профиль обновлён');
      fetchUserData();
      return true;
    } catch (error) {
      const errorMsg = error.response?.data?.error || 'Ошибка обновления профиля';
      toast.error(errorMsg);
      return false;
    }
  }, [profileForm, fetchUserData]);

  // Смена пароля
  const handlePasswordSubmit = useCallback(async (e) => {
    e.preventDefault();

    if (passwordForm.new_password !== passwordForm.confirm_password) {
      toast.error('Пароли не совпадают');
      return;
    }

    if (passwordForm.new_password.length < 8) {
      toast.error('Пароль должен содержать минимум 8 символов');
      return;
    }

    try {
      await api.post('/users/me/change-password/', {
        current_password: passwordForm.current_password,
        new_password: passwordForm.new_password,
        confirm_password: passwordForm.confirm_password
      });
      toast.success('Пароль успешно изменён');
      setPasswordForm({
        current_password: '',
        new_password: '',
        confirm_password: ''
      });
    } catch (error) {
      const errorMsg = error.response?.data?.error || 'Ошибка смены пароля';
      toast.error(errorMsg);
    }
  }, [passwordForm]);

  // Завершение сессии (делегируем в useUserSessions)
  const handleTerminateSession = useCallback(async (sessionId) => {
    try {
      await terminateSession(sessionId);
      // useUserSessions уже показывает toast и перезагружает данные
    } catch (error) {
      toast.error(error.message || 'Ошибка завершения сессии');
    }
  }, [terminateSession]);

  return {
    // Данные
    user,
    history,
    sessions,
    loading: loading || sessionsLoading || historyLoading,
    // Формы
    profileForm,
    setProfileForm,
    passwordForm,
    setPasswordForm,
    // Функции
    fetchUserData,
    handleProfileSubmit,
    handlePasswordSubmit,
    handleTerminateSession
  };
};

export default useProfile;

