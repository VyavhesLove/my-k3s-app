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
