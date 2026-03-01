import api from './axios';

/**
 * API функции для работы с настройками режима обслуживания (Maintenance Mode).
 */

/**
 * Получить все настройки режима обслуживания.
 * @returns {Promise<Object>} Объект с настройками:
 *   - enabled: boolean - включен/выключен режим
 *   - planned_end_time: string | null - запланированное время завершения
 *   - ips: string[] - список разрешённых IP-адресов
 *   - urls: string[] - список разрешённых URL (regex)
 *   - admin_users: string[] - список пользователей с доступом (только чтение)
 * @throws {Object} Ошибка API
 */
export const getMaintenanceSettings = async () => {
  try {
    const response = await api.get('maintenance/settings/');
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

/**
 * Обновить настройки режима обслуживания.
 * @param {Object} data - Данные для обновления
 * @param {boolean} [data.enabled] - Включить/выключить режим
 * @param {string|null} [data.planned_end_time] - Время завершения (ISO 8601)
 * @param {string[]} [data.ips] - Список IP-адресов
 * @param {string[]} [data.urls] - Список URL (regex)
 * @returns {Promise<Object>} Обновлённые настройки
 * @throws {Object} Ошибка API
 */
export const updateMaintenanceSettings = async (data) => {
  try {
    const response = await api.patch('maintenance/settings/', data);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

/**
 * Включить/выключить режим обслуживания.
 * @param {boolean} enabled - Новое состояние режима
 * @returns {Promise<Object>} Объект с новым состоянием:
 *   - enabled: boolean - текущее состояние
 *   - planned_end_time: string | null - время завершения
 *   - message: string - сообщение о результате
 * @throws {Object} Ошибка API
 */
export const toggleMaintenanceMode = async (enabled) => {
  try {
    const response = await api.post('maintenance/toggle/', { enabled });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export default {
  getMaintenanceSettings,
  updateMaintenanceSettings,
  toggleMaintenanceMode,
};

