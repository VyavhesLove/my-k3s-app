import React from 'react';
import { X, Lock, Key, Users, LogOut } from 'lucide-react';
import { getRoleText } from '@/utils/role';

// Стили для ролей (как в UsersTable_new)
const getRoleStyles = (role, isDarkMode) => {
  const styles = {
    admin: isDarkMode
      ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
      : 'bg-purple-100 text-purple-700 border border-purple-200',
    storekeeper: isDarkMode
      ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
      : 'bg-blue-100 text-blue-700 border border-blue-200',
    foreman: isDarkMode
      ? 'bg-green-500/20 text-green-400 border border-green-500/30'
      : 'bg-green-100 text-green-700 border border-green-200',
  };
  return styles[role] || (isDarkMode ? 'bg-slate-800 text-slate-400' : 'bg-gray-100 text-gray-500');
};

const UserDetailPanel = ({ user, onClose, isDarkMode }) => {
  const isOpen = !!user;

  // Обработчики-заполнители для кнопок действий
  const handleBlockUnblock = () => {
    console.log('Нажата кнопка: Заблокировать/Разблокировать пользователя', user?.id);
    // TODO: Интеграция с API - заблокировать/разблокировать пользователя
  };

  const handleResetPassword = () => {
    console.log('Нажата кнопка: Сброс пароля', user?.id);
    // TODO: Интеграция с API - сброс пароля
  };

  const handleSessions = () => {
    console.log('Нажата кнопка: Сеансы', user?.id);
    // TODO: Интеграция с API - получить список сеансов
  };

  const handleLogout = () => {
    console.log('Нажата кнопка: Выход (принудительно)', user?.id);
    // TODO: Интеграция с API - принудительный выход пользователя
  };

  return (
    <div 
      className={`fixed right-0 top-0 h-full w-[400px] shadow-2xl z-50 flex flex-col transition-transform duration-300 ease-in-out ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      } ${
        isDarkMode ? 'bg-slate-900 border-l border-slate-800 text-white' : 'bg-white border-l border-gray-200 text-slate-900'
      }`}
    >
      {/* Шапка панели */}
      <div className="p-6 border-b border-gray-200 flex justify-between items-center relative z-10">
        <h2 className="text-xl font-bold uppercase tracking-tight">Информация о пользователе</h2>
        <button 
          type="button"
          onClick={(e) => { 
            e.stopPropagation(); 
            onClose(); 
          }} 
          className="p-2 hover:bg-gray-500/10 rounded-full transition-colors"
          aria-label="Закрыть панель"
        >
          <X size={24} />
        </button>
      </div>

      {/* Контент */}
      {user && (
        <div className="flex-1 flex flex-col min-h-0 p-6 space-y-6">
          
          {/* СТАТИЧНЫЙ БЛОК: Информация о пользователе */}
          <section className="space-y-6">
            <div>
              <div className="text-sm text-gray-500 uppercase font-semibold mb-3">Роль</div>
              <div className={`inline-flex px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${getRoleStyles(user.role, isDarkMode)}`}>
                {getRoleText(user.role)}
              </div>
            </div>

            {/* Индикатор статуса пользователя */}
            <div className={`p-3 rounded-xl flex items-center gap-2 text-sm ${
              user.is_active 
                ? (isDarkMode ? 'bg-green-500/20 border border-green-500/30' : 'bg-green-50 border border-green-200')
                : (isDarkMode ? 'bg-red-500/20 border border-red-500/30' : 'bg-red-50 border border-red-200')
            }`}>
              <Lock 
                className={user.is_active 
                  ? (isDarkMode ? 'text-green-400' : 'text-green-600')
                  : (isDarkMode ? 'text-red-400' : 'text-red-600')
                } 
                size={16} 
              />
              <span className={user.is_active 
                ? (isDarkMode ? 'text-green-400' : 'text-green-600')
                : (isDarkMode ? 'text-red-400' : 'text-red-600')
              }>
                {user.is_active ? 'Активен' : 'Заблокирован'}
              </span>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <DetailRow label="Логин" value={user.username} />
              <DetailRow label="Имя пользователя" value={user.first_name || '—'} />
              <DetailRow label="Фамилия" value={user.last_name || '—'} />
              <DetailRow label="Электронная почта" value={user.email || '—'} />
            </div>
          </section>

          {/* Блок кнопок действий */}
          <section className="py-2 space-y-3">
            <div className="text-sm text-gray-500 uppercase font-semibold mb-3">Действия</div>
            
            {/* Кнопка Заблокировать/Разблокировать */}
            <button
              onClick={handleBlockUnblock}
              className={`w-full py-3 px-4 flex items-center justify-center gap-2 rounded-xl font-medium transition-all active:scale-95 ${
                user.is_active 
                  ? (isDarkMode 
                      ? 'bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30' 
                      : 'bg-red-100 text-red-700 border border-red-200 hover:bg-red-200')
                  : (isDarkMode 
                      ? 'bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-green-500/30' 
                      : 'bg-green-100 text-green-700 border border-green-200 hover:bg-green-200')
              }`}
            >
              <Lock size={18} />
              {user.is_active ? 'Заблокировать пользователя' : 'Разблокировать пользователя'}
            </button>

            {/* Кнопка Сброс пароля */}
            <button
              onClick={handleResetPassword}
              className={`w-full py-3 px-4 flex items-center justify-center gap-2 rounded-xl font-medium transition-all active:scale-95 ${
                isDarkMode 
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30 hover:bg-amber-500/30' 
                  : 'bg-amber-100 text-amber-700 border border-amber-200 hover:bg-amber-200'
              }`}
            >
              <Key size={18} />
              Сброс пароля
            </button>

            {/* Кнопка Сеансы */}
            <button
              onClick={handleSessions}
              className={`w-full py-3 px-4 flex items-center justify-center gap-2 rounded-xl font-medium transition-all active:scale-95 ${
                isDarkMode 
                  ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30 hover:bg-blue-500/30' 
                  : 'bg-blue-100 text-blue-700 border border-blue-200 hover:bg-blue-200'
              }`}
            >
              <Users size={18} />
              Сеансы
            </button>

            {/* Кнопка Выход (принудительно) */}
            <button
              onClick={handleLogout}
              className={`w-full py-3 px-4 flex items-center justify-center gap-2 rounded-xl font-medium transition-all active:scale-95 ${
                isDarkMode 
                  ? 'bg-gray-500/20 text-gray-400 border border-gray-500/30 hover:bg-gray-500/30' 
                  : 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200'
              }`}
            >
              <LogOut size={18} />
              Выход (принудительно)
            </button>

            <p className="text-[10px] text-center mt-2 opacity-50 uppercase font-bold text-gray-400">
              Нажмите для выполнения действия
            </p>
          </section>

          {/* Нижний колонтитул (заполнитель) */}
          <section className="border-t border-gray-500/10 pt-4 mt-auto">
            <p className="text-[10px] text-center opacity-50 text-gray-400">
              ID пользователя: {user.id}
            </p>
          </section>
        </div>
      )}
    </div>
  );
};

// Вспомогательный компонент для отображения полей
const DetailRow = ({ label, value }) => (
  <div className="space-y-1">
    <div className="text-[10px] uppercase text-gray-500 font-bold">{label}</div>
    <div className="text-sm font-medium">{value}</div>
  </div>
);

export default UserDetailPanel;

