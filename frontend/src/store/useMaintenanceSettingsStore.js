import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { toast } from 'sonner';
import {
  getMaintenanceSettings,
  updateMaintenanceSettings,
  toggleMaintenanceMode,
} from '@/api/maintenanceApi';
import {
  maintenanceSettingsSchema,
  maintenanceSettingsUpdateSchema,
  maintenanceToggleSchema,
  ipSchema,
  urlRegexSchema,
  isValidIp,
  isValidUrlRegex,
} from '@/schemas/maintenance';

/**
 * Начальное состояние настроек режима обслуживания
 */
const initialSettings = {
  enabled: false,
  planned_end_time: null,
  ips: [],
  urls: [],
  admin_users: [],
};

/**
 * Zustand store для управления настройками режима обслуживания (Maintenance Mode).
 * Использует persist() для сохранения настроек в localStorage.
 * 
 * Состояние:
 * - settings: объект с настройками (enabled, planned_end_time, ips, urls, admin_users)
 * - loading: флаг загрузки
 * - error: сообщение об ошибке
 * 
 * Методы:
 * - fetchSettings(): загрузить настройки с сервера
 * - updateSettings(data): обновить настройки
 * - toggleMaintenance(): переключить режим обслуживания
 */
export const useMaintenanceSettingsStore = create(
  persist(
    (set, get) => ({
      // === СОСТОЯНИЕ ===
      settings: initialSettings,
      loading: false,
      error: null,

      // === МЕТОДЫ ===

      /**
       * Загрузить настройки с сервера.
       * Вызывается при монтировании страницы настроек.
       */
      fetchSettings: async () => {
        set({ loading: true, error: null });
        
        try {
          const data = await getMaintenanceSettings();
          
          set({
            settings: {
              enabled: data.enabled ?? false,
              planned_end_time: data.planned_end_time ?? null,
              ips: data.ips ?? [],
              urls: data.urls ?? [],
              admin_users: data.admin_users ?? [],
            },
            loading: false,
            error: null,
          });
          
          return { success: true, data };
          
        } catch (error) {
          const errorMessage = error?.error 
            || error?.message 
            || 'Не удалось загрузить настройки';
          
          set({
            loading: false,
            error: errorMessage,
          });
          
          toast.error('❌ Ошибка загрузки настроек', {
            description: errorMessage,
            duration: 5000,
          });
          
          return { success: false, error: errorMessage };
        }
      },

      /**
       * Обновить настройки режима обслуживания.
       * @param {Object} data - Данные для обновления
       * @param {boolean} [data.enabled] - Включить/выключить режим
       * @param {string|null} [data.planned_end_time] - Время завершения
       * @param {string[]} [data.ips] - Список IP-адресов
       * @param {string[]} [data.urls] - Список URL
       */
      updateSettings: async (data) => {
        // Валидация данных с помощью Zod схемы
        const validationResult = maintenanceSettingsUpdateSchema.safeParse(data);
        
        if (!validationResult.success) {
          const errors = validationResult.error.errors.map(e => e.message).join(', ');
          set({ error: errors });
          toast.error('❌ Ошибка валидации', {
            description: errors,
            duration: 5000,
          });
          return { success: false, error: errors };
        }
        
        set({ loading: true, error: null });
        
        try {
          const response = await updateMaintenanceSettings(data);
          
          // Обновляем локальное состояние с полученными данными
          const currentSettings = get().settings;
          const updatedSettings = {
            ...currentSettings,
            ...response,
          };
          
          set({
            settings: updatedSettings,
            loading: false,
            error: null,
          });
          
          toast.success('✅ Настройки сохранены', {
            duration: 3000,
          });
          
          return { success: true, data: response };
          
        } catch (error) {
          const errorMessage = error?.error 
            || error?.message 
            || 'Не удалось обновить настройки';
          
          set({
            loading: false,
            error: errorMessage,
          });
          
          toast.error('❌ Ошибка сохранения настроек', {
            description: errorMessage,
            duration: 5000,
          });
          
          return { success: false, error: errorMessage };
        }
      },

      /**
       * Переключить режим обслуживания (включить/выключить).
       * @param {boolean} enabled - Новое состояние
       */
      toggleMaintenance: async (enabled) => {
        // Валидация данных с помощью Zod схемы
        const validationResult = maintenanceToggleSchema.safeParse({ enabled });
        
        if (!validationResult.success) {
          const errors = validationResult.error.errors.map(e => e.message).join(', ');
          set({ error: errors });
          toast.error('❌ Ошибка валидации', {
            description: errors,
            duration: 5000,
          });
          return { success: false, error: errors };
        }
        
        set({ loading: true, error: null });
        
        try {
          const response = await toggleMaintenanceMode(enabled);
          
          // Обновляем только поле enabled
          const currentSettings = get().settings;
          set({
            settings: {
              ...currentSettings,
              enabled: response.enabled ?? enabled,
              planned_end_time: response.planned_end_time ?? currentSettings.planned_end_time,
            },
            loading: false,
            error: null,
          });
          
          toast.success(
            enabled ? '🔧 Режим обслуживания включён' : '✅ Режим обслуживания выключен',
            {
              duration: 3000,
            }
          );
          
          return { success: true, data: response };
          
        } catch (error) {
          const errorMessage = error?.error 
            || error?.message 
            || 'Не удалось переключить режим';
          
          set({
            loading: false,
            error: errorMessage,
          });
          
          toast.error('❌ Ошибка переключения режима', {
            description: errorMessage,
            duration: 5000,
          });
          
          return { success: false, error: errorMessage };
        }
      },

      /**
       * Добавить IP-адрес к списку разрешённых.
       * @param {string} ip - IP-адрес
       */
      addIp: async (ip) => {
        // Валидация IP адреса
        if (!isValidIp(ip)) {
          const error = 'Некорректный IP адрес';
          set({ error });
          toast.error('❌ Ошибка валидации', {
            description: error,
            duration: 5000,
          });
          return { success: false, error };
        }
        
        const { settings, updateSettings } = get();
        
        // Проверка на дубликат
        if (settings.ips.includes(ip)) {
          const error = 'IP адрес уже существует в списке';
          set({ error });
          toast.error('❌ Ошибка', {
            description: error,
            duration: 5000,
          });
          return { success: false, error };
        }
        
        const newIps = [...settings.ips, ip];
        return updateSettings({ ips: newIps });
      },

      /**
       * Удалить IP-адрес из списка разрешённых.
       * @param {string} ip - IP-адрес
       */
      removeIp: async (ip) => {
        const { settings, updateSettings } = get();
        const newIps = settings.ips.filter((item) => item !== ip);
        return updateSettings({ ips: newIps });
      },

      /**
       * Добавить URL к списку разрешённых.
       * @param {string} url - URL (regex)
       */
      addUrl: async (url) => {
        // Валидация URL regex паттерна
        if (!isValidUrlRegex(url)) {
          const error = 'Некорректный regex паттерн';
          set({ error });
          toast.error('❌ Ошибка валидации', {
            description: error,
            duration: 5000,
          });
          return { success: false, error };
        }
        
        const { settings, updateSettings } = get();
        
        // Проверка на дубликат
        if (settings.urls.includes(url)) {
          const error = 'URL уже существует в списке';
          set({ error });
          toast.error('❌ Ошибка', {
            description: error,
            duration: 5000,
          });
          return { success: false, error };
        }
        
        const newUrls = [...settings.urls, url];
        return updateSettings({ urls: newUrls });
      },

      /**
       * Удалить URL из списка разрешённых.
       * @param {string} url - URL (regex)
       */
      removeUrl: async (url) => {
        const { settings, updateSettings } = get();
        const newUrls = settings.urls.filter((item) => item !== url);
        return updateSettings({ urls: newUrls });
      },

      /**
       * Сбросить состояние к начальным значениям.
       */
      reset: () => set({
        settings: initialSettings,
        loading: false,
        error: null,
      }),

      /**
       * Очистить ошибку.
       */
      clearError: () => set({ error: null }),
    }),
    {
      name: 'maintenance-settings-storage', // ключ в localStorage
      partialize: (state) => ({ 
        // Сохраняем только настройки, не сохраняем loading/error
        settings: state.settings 
      }),
    }
  )
);

export default useMaintenanceSettingsStore;

