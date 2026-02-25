// Утилиты для работы с ролями

/**
 * Получение текстового названия роли
 * @param {string} role - Роль пользователя
 * @returns {string} Текстовое название роли
 */
export const getRoleText = (role) => {
  const roles = {
    admin: 'Администратор',
    storekeeper: 'Кладовщик',
    foreman: 'Бригадир',
    default: 'Пользователь'
  };
  return roles[role] || roles.default;
};

