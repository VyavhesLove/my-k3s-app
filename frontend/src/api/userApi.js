import api from './axios';

// Функция для блокировки/разблокировки пользователя
export const toggleUserBlock = async (userId) => {
  try {
    const response = await api.post(`users/${userId}/toggle-block/`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};
