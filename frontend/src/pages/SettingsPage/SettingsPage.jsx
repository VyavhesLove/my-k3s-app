import React, { useEffect, useState } from 'react';
import { useMaintenanceSettingsStore } from '@/store/useMaintenanceSettingsStore';
import IpsTable from './components/IpsTable';
import AdminUsersTable from './components/AdminUsersTable';
import UrlsTable from './components/UrlsTable';
import { 
  Settings, 
  Shield, 
  Wifi, 
  Globe, 
  Users, 
  Calendar, 
  Power,
  PowerOff,
  RefreshCw
} from 'lucide-react';

/**
 * Страница настроек системы.
 * Содержит настройки режима обслуживания (Maintenance Mode).
 */
const SettingsPage = ({ isDarkMode }) => {
  const { 
    settings, 
    loading, 
    error, 
    fetchSettings, 
    updateSettings,
    toggleMaintenance,
    clearError 
  } = useMaintenanceSettingsStore();

  const [plannedEndTime, setPlannedEndTime] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Загружаем настройки при монтировании
  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  // Синхронизируем planned_end_time с локальным состоянием
  useEffect(() => {
    if (settings.planned_end_time) {
      // Конвертируем ISO строку в формат для datetime-local input
      const date = new Date(settings.planned_end_time);
      const localDateTime = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 16);
      setPlannedEndTime(localDateTime);
    } else {
      setPlannedEndTime('');
    }
  }, [settings.planned_end_time]);

  // Обработчик переключения режима обслуживания
  const handleToggleMaintenance = async (enabled) => {
    await toggleMaintenance(enabled);
  };

  // Обработчик изменения запланированного времени завершения
  const handlePlannedEndTimeChange = async (e) => {
    const value = e.target.value;
    setPlannedEndTime(value);
    
    // Автоматически сохраняем при изменении
    const plannedTime = value ? new Date(value).toISOString() : null;
    setIsSaving(true);
    await updateSettings({ planned_end_time: plannedTime });
    setIsSaving(false);
  };

  // Очистка запланированного времени
  const handleClearPlannedTime = async () => {
    setIsSaving(true);
    await updateSettings({ planned_end_time: null });
    setIsSaving(false);
  };

  return (
    <div className="space-y-6">
      {/* Заголовок */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-orange-600/20 rounded-xl">
            <Settings className="w-8 h-8 text-orange-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Настройки системы</h1>
            <p className="opacity-60">Управление режимом обслуживания</p>
          </div>
        </div>
        
        {/* Кнопка обновления */}
        <button
          onClick={() => fetchSettings()}
          disabled={loading}
          className={`p-2 rounded-lg transition-colors ${
            isDarkMode 
              ? 'hover:bg-gray-700 text-gray-400 hover:text-white' 
              : 'hover:bg-gray-100 text-gray-500 hover:text-gray-900'
          } disabled:opacity-50`}
          title="Обновить настройки"
        >
          <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Сообщение об ошибке */}
      {error && (
        <div className={`p-4 rounded-lg border ${
          isDarkMode 
            ? 'bg-red-900/20 border-red-800 text-red-400' 
            : 'bg-red-50 border-red-200 text-red-600'
        }`}>
          <div className="flex items-center justify-between">
            <span>{error}</span>
            <button onClick={clearError} className="text-sm underline">
              Закрыть
            </button>
          </div>
        </div>
      )}

      {/* Секция: Режим обслуживания */}
      <div className={`p-6 rounded-2xl border ${
        isDarkMode 
          ? 'bg-slate-800 border-slate-700' 
          : 'bg-white border-gray-200'
      }`}>
        <div className="flex items-center gap-3 mb-6">
          <div className={`p-2 rounded-lg ${settings.enabled ? 'bg-red-500/20' : 'bg-green-500/20'}`}>
            <Shield className={`w-5 h-5 ${settings.enabled ? 'text-red-500' : 'text-green-500'}`} />
          </div>
          <h2 className="text-lg font-semibold">Режим обслуживания</h2>
        </div>

        <div className="space-y-4">
          {/* Переключатель Вкл/Выкл */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-gray-500/5">
            <div className="flex items-center gap-3">
              {settings.enabled ? (
                <PowerOff className="w-5 h-5 text-red-500" />
              ) : (
                <Power className="w-5 h-5 text-green-500" />
              )}
              <div>
                <p className="font-medium">
                  {settings.enabled ? 'Режим обслуживания включён' : 'Режим обслуживания выключен'}
                </p>
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  {settings.enabled 
                    ? 'Доступ к системе ограничен для обычных пользователей'
                    : 'Система работает в обычном режиме'
                  }
                </p>
              </div>
            </div>
            
            <button
              onClick={() => handleToggleMaintenance(!settings.enabled)}
              disabled={loading}
              className={`relative w-14 h-8 rounded-full transition-colors ${
                settings.enabled ? 'bg-red-500' : 'bg-gray-400'
              } disabled:opacity-50`}
            >
              <div className={`absolute top-1 w-6 h-6 rounded-full bg-white transition-transform ${
                settings.enabled ? 'translate-x-7' : 'translate-x-1'
              }`} />
            </button>
          </div>

          {/* Планируемое время завершения */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium">
              <Calendar className="w-4 h-4" />
              Планируемое время завершения
            </label>
            <div className="flex gap-2">
              <input
                type="datetime-local"
                value={plannedEndTime}
                onChange={handlePlannedEndTimeChange}
                disabled={isSaving || !settings.enabled}
                className={`flex-1 px-4 py-2 rounded-lg border ${
                  isDarkMode 
                    ? 'bg-gray-800 border-gray-700 text-white disabled:opacity-50' 
                    : 'bg-white border-gray-300 text-gray-900 disabled:opacity-50'
                } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:cursor-not-allowed`}
              />
              {plannedEndTime && (
                <button
                  onClick={handleClearPlannedTime}
                  disabled={isSaving}
                  className={`px-4 py-2 rounded-lg border transition-colors ${
                    isDarkMode 
                      ? 'border-gray-600 hover:bg-gray-700' 
                      : 'border-gray-300 hover:bg-gray-100'
                  } disabled:opacity-50`}
                >
                  Очистить
                </button>
              )}
            </div>
            <p className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
              Укажите время, когда планируется завершить обслуживание (опционально)
            </p>
          </div>
        </div>
      </div>

      {/* Секция: Разрешённые IP-адреса */}
      <div className={`p-6 rounded-2xl border ${
        isDarkMode 
          ? 'bg-slate-800 border-slate-700' 
          : 'bg-white border-gray-200'
      }`}>
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg bg-green-500/20">
            <Wifi className="w-5 h-5 text-green-500" />
          </div>
          <h2 className="text-lg font-semibold">Разрешённые IP-адреса</h2>
        </div>

        <p className={`text-sm mb-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          IP-адреса, которые будут иметь доступ к системе во время режима обслуживания.
          Поддерживаются IPv4 и IPv6 адреса.
        </p>

        <IpsTable isDarkMode={isDarkMode} />
      </div>

      {/* Секция: Пользователи с доступом */}
      <div className={`p-6 rounded-2xl border ${
        isDarkMode 
          ? 'bg-slate-800 border-slate-700' 
          : 'bg-white border-gray-200'
      }`}>
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg bg-blue-500/20">
            <Users className="w-5 h-5 text-blue-500" />
          </div>
          <h2 className="text-lg font-semibold">Пользователи с доступом</h2>
        </div>

        <p className={`text-sm mb-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          Список пользователей, которые имеют доступ к системе во время режима обслуживания.
          Определяется автоматически на основе роли пользователя.
        </p>

        <AdminUsersTable isDarkMode={isDarkMode} />
      </div>

      {/* Секция: Разрешённые URL */}
      <div className={`p-6 rounded-2xl border ${
        isDarkMode 
          ? 'bg-slate-800 border-slate-700' 
          : 'bg-white border-gray-200'
      }`}>
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg bg-purple-500/20">
            <Globe className="w-5 h-5 text-purple-500" />
          </div>
          <h2 className="text-lg font-semibold">Разрешённые URL</h2>
        </div>

        <p className={`text-sm mb-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          URL-адреса (поддержка regex), которые будут доступны во время режима обслуживания.
          Например: /api/health, /api/v1/*, /admin/.*
        </p>

        <UrlsTable isDarkMode={isDarkMode} />
      </div>
    </div>
  );
};

export default SettingsPage;

