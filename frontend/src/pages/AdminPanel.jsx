import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings, Users, Database, Shield, BookOpen, Key } from 'lucide-react';
import { getSystemStats } from '@/api/userApi';

export const AdminPanel = ({ isDarkMode }) => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(false);

  useEffect(() => {
    const fetchStats = async () => {
      setStatsLoading(true);
      try {
        const data = await getSystemStats();
        setStats(data);
      } catch (error) {
        console.error('Failed to fetch system stats:', error);
      } finally {
        setStatsLoading(false);
      }
    };

    fetchStats();
  }, []);

  return (
    <div className="space-y-6">
      {/* Заголовок */}
      <div className="flex items-center gap-3">
        <div className="p-3 bg-blue-600/20 rounded-xl">
          <Shield className="w-8 h-8 text-blue-500" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Админ-панель</h1>
          <p className="opacity-60">Управление системой</p>
        </div>
      </div>

      {/* Карточки управления */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Пользователи */}
        <div 
          onClick={() => navigate('/admin-panel/users')}
          className={`p-6 rounded-2xl border transition-all hover:scale-[1.02] cursor-pointer ${
          isDarkMode 
            ? 'bg-slate-800 border-slate-700 hover:border-blue-500' 
            : 'bg-white border-gray-200 hover:border-blue-500'
        }`}>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-500/20 rounded-xl">
              <Users className="w-6 h-6 text-green-500" />
            </div>
            <div>
              <h3 className="font-semibold">Пользователи</h3>
              <p className="text-sm opacity-60">Управление учетными записями</p>
            </div>
          </div>
        </div>

        {/* База данных */}
        <div className={`p-6 rounded-2xl border transition-all hover:scale-[1.02] cursor-pointer ${
          isDarkMode 
            ? 'bg-slate-800 border-slate-700 hover:border-purple-500' 
            : 'bg-white border-gray-200 hover:border-purple-500'
        }`}>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-500/20 rounded-xl">
              <Database className="w-6 h-6 text-purple-500" />
            </div>
            <div>
              <h3 className="font-semibold">База данных</h3>
              <p className="text-sm opacity-60">Резервное копирование</p>
            </div>
          </div>
        </div>

        {/* Настройки системы */}
        <div className={`p-6 rounded-2xl border transition-all hover:scale-[1.02] cursor-pointer ${
          isDarkMode 
            ? 'bg-slate-800 border-slate-700 hover:border-orange-500' 
            : 'bg-white border-gray-200 hover:border-orange-500'
        }`}>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-orange-500/20 rounded-xl">
              <Settings className="w-6 h-6 text-orange-500" />
            </div>
            <div>
              <h3 className="font-semibold">Настройки</h3>
              <p className="text-sm opacity-60">Конфигурация системы</p>
            </div>
          </div>
        </div>

        {/* API Swagger */}
        <div 
          onClick={() => window.open('/api/docs/', '_blank')}
          className={`p-6 rounded-2xl border transition-all hover:scale-[1.02] cursor-pointer ${
          isDarkMode 
            ? 'bg-slate-800 border-slate-700 hover:border-cyan-500' 
            : 'bg-white border-gray-200 hover:border-cyan-500'
        }`}>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-cyan-500/20 rounded-xl">
              <BookOpen className="w-6 h-6 text-cyan-500" />
            </div>
            <div>
              <h3 className="font-semibold">API Swagger</h3>
              <p className="text-sm opacity-60">Документация API</p>
            </div>
          </div>
        </div>

        {/* Django Administration */}
        <div 
          onClick={() => window.open('/admin', '_blank')}
          className={`p-6 rounded-2xl border transition-all hover:scale-[1.02] cursor-pointer ${
          isDarkMode 
            ? 'bg-slate-800 border-slate-700 hover:border-red-500' 
            : 'bg-white border-gray-200 hover:border-red-500'
        }`}>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-red-500/20 rounded-xl">
              <Key className="w-6 h-6 text-red-500" />
            </div>
            <div>
              <h3 className="font-semibold">Django Admin</h3>
              <p className="text-sm opacity-60">Админ-панель Django</p>
            </div>
          </div>
        </div>
      </div>

      {/* Статус системы */}
      <div className={`p-6 rounded-2xl border ${
        isDarkMode 
          ? 'bg-slate-800 border-slate-700' 
          : 'bg-white border-gray-200'
      }`}>
        <h3 className="font-semibold mb-4">Статус системы</h3>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="opacity-60">Версия приложения</span>
            <span className="font-mono">1.0.0</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="opacity-60">Статус БД</span>
            <span className="text-green-500 flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              Подключено
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="opacity-60">Активные пользователи</span>
            <span className="font-semibold">
              {statsLoading ? '...' : stats?.active_users_count ?? '-'}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="opacity-60">Активные сессии</span>
            <span className="font-semibold">
              {statsLoading ? '...' : stats?.active_sessions_count ?? '-'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

