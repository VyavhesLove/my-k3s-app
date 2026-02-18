import React from 'react';
import { Shield } from 'lucide-react';
import { getRoleText } from '@/utils';

// Компонент отображения данных профиля (read-only)
const ProfileInfo = ({ user }) => {
  if (!user) return null;

  return (
    <div className="bg-card rounded-lg p-6 border border-theme">
      <div className="flex items-center gap-4 mb-6">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-3xl font-bold">
          {user.username?.charAt(0).toUpperCase() || 'U'}
        </div>
        <div>
          <h2 className="text-xl font-bold text-primary">{user.username}</h2>
          <p className="text-sm opacity-60 flex items-center gap-2">
            <Shield size={14} className="text-blue-500" />
            {getRoleText(user.role)}
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-primary opacity-60">
              Имя
            </label>
            <p className="text-primary">{user.first_name || '-'}</p>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-primary opacity-60">
              Фамилия
            </label>
            <p className="text-primary">{user.last_name || '-'}</p>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1 text-primary opacity-60">
            Email
          </label>
          <p className="text-primary">{user.email || '-'}</p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1 text-primary opacity-60">
            Логин
          </label>
          <p className="text-primary">{user.username}</p>
          <p className="text-xs text-gray-500 mt-1">Логин нельзя изменить</p>
        </div>
      </div>
    </div>
  );
};

export default ProfileInfo;

