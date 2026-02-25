import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import api from '@/api/axios';

/**
 * Хук для работы с сессиями пользователя
 * @returns {Object} Состояние и функции для управления сессиями
 */
export const useUserSessions = () => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchSessions = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get('/users/me/sessions/');
      setSessions(response.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Ошибка загрузки сессий');
    } finally {
      setLoading(false);
    }
  }, []);

  const terminateSession = useCallback(async (sessionId) => {
    try {
      await api.post('/users/me/sessions/terminate/', { session_id: sessionId });
      toast.success('Сессия завершена');
      await fetchSessions();
    } catch (err) {
      throw new Error(err.response?.data?.error || 'Ошибка завершения сессии');
    }
  }, [fetchSessions]);

  return {
    sessions,
    loading,
    error,
    fetchSessions,
    terminateSession
  };
};

/**
 * Хук для работы с историей пользователя
 * @returns {Object} Состояние и функции для управления историей
 */
export const useUserHistory = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchHistory = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get('/users/me/history/');
      setHistory(response.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Ошибка загрузки истории');
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    history,
    loading,
    error,
    fetchHistory
  };
};

