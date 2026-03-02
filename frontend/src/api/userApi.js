import api from './axios';

// Функция для получения системной статистики (для админ-панели)
export const getSystemStats = async () => {
  try {
    const response = await api.get('users/stats/');
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Функция для получения сессий пользователя (для админа)
export const getUserSessions = async (userId) => {
  try {
    const response = await api.get(`users/${userId}/sessions/`);
    // Гарантируем возврат массива
    if (Array.isArray(response.data)) {
      return response.data;
    }
    // Если ответ в другом формате - возвращаем пустой массив
    console.warn('Unexpected response format for sessions:', response.data);
    return [];
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Функция для завершения одной сессии пользователя (для админа)
export const terminateSession = async (userId, sessionId) => {
  try {
    const response = await api.post(`users/${userId}/sessions/${sessionId}/terminate/`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Функция для завершения всех сессий пользователя (для админа)
export const terminateAllSessions = async (userId) => {
  try {
    const response = await api.post(`users/${userId}/sessions/terminate-all/`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Функция для блокировки/разблокировки пользователя
export const toggleUserBlock = async (userId) => {
  try {
    const response = await api.post(`users/${userId}/toggle-block/`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Функция для сброса пароля пользователя администратором
export const resetUserPassword = async (userId, newPassword, confirmPassword) => {
  try {
    const response = await api.post(`users/${userId}/reset-password/`, {
      new_password: newPassword,
      confirm_password: confirmPassword,
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};
