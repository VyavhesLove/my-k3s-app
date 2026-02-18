import React from 'react';
import { User, History, Shield, Lock } from 'lucide-react';

// Компонент вкладок профиля
const ProfileTabs = ({ activeTab, onTabChange }) => {
  return (
    <div className="flex gap-2 mb-6 border-b border-theme pb-2">
      <button
        onClick={() => onTabChange('profile')}
        className={`flex items-center gap-2 px-4 py-2 rounded-t-lg transition-colors ${
          activeTab === 'profile'
            ? 'bg-blue-500/20 text-blue-500 border-b-2 border-blue-500'
            : 'hover:bg-blue-500/10 text-primary'
        }`}
      >
        <User size={18} />
        Профиль
      </button>
      <button
        onClick={() => onTabChange('history')}
        className={`flex items-center gap-2 px-4 py-2 rounded-t-lg transition-colors ${
          activeTab === 'history'
            ? 'bg-blue-500/20 text-blue-500 border-b-2 border-blue-500'
            : 'hover:bg-blue-500/10 text-primary'
        }`}
      >
        <History size={18} />
        История
      </button>
      <button
        onClick={() => onTabChange('sessions')}
        className={`flex items-center gap-2 px-4 py-2 rounded-t-lg transition-colors ${
          activeTab === 'sessions'
            ? 'bg-blue-500/20 text-blue-500 border-b-2 border-blue-500'
            : 'hover:bg-blue-500/10 text-primary'
        }`}
      >
        <Shield size={18} />
        Сессии
      </button>
      <button
        onClick={() => onTabChange('security')}
        className={`flex items-center gap-2 px-4 py-2 rounded-t-lg transition-colors ${
          activeTab === 'security'
            ? 'bg-blue-500/20 text-blue-500 border-b-2 border-blue-500'
            : 'hover:bg-blue-500/10 text-primary'
        }`}
      >
        <Lock size={18} />
        Безопасность
      </button>
    </div>
  );
};

export default ProfileTabs;

