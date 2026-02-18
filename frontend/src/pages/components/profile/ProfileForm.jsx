import React from 'react';
import { Mail, Save } from 'lucide-react';

// Компонент формы редактирования профиля
const ProfileForm = ({ profileForm, setProfileForm, onSubmit, user, onCancel }) => {
  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(e);
  };

  return (
    <div className="bg-card rounded-lg p-6 border border-theme">
      <div className="flex items-center gap-4 mb-6">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-3xl font-bold">
          {user?.username?.charAt(0).toUpperCase() || 'U'}
        </div>
        <div>
          <h2 className="text-xl font-bold text-primary">{user?.username}</h2>
          <p className="text-sm opacity-60">Редактирование профиля</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-primary">
              Имя
            </label>
            <input
              type="text"
              value={profileForm.first_name}
              onChange={(e) => setProfileForm({ ...profileForm, first_name: e.target.value })}
              className="w-full px-3 py-2 rounded-lg input-theme"
              placeholder="Ваше имя"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-primary">
              Фамилия
            </label>
            <input
              type="text"
              value={profileForm.last_name}
              onChange={(e) => setProfileForm({ ...profileForm, last_name: e.target.value })}
              className="w-full px-3 py-2 rounded-lg input-theme"
              placeholder="Ваша фамилия"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1 text-primary">
            Email
          </label>
          <div className="relative">
            <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="email"
              value={profileForm.email}
              onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
              className="w-full pl-10 pr-3 py-2 rounded-lg input-theme"
              placeholder="email@example.com"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1 text-primary">
            Логин
          </label>
          <input
            type="text"
            value={user?.username || ''}
            disabled
            className="w-full px-3 py-2 rounded-lg input-theme opacity-60 cursor-not-allowed"
          />
          <p className="text-xs text-gray-500 mt-1">Логин нельзя изменить</p>
        </div>

        <div className="flex gap-2">
          <button
            type="submit"
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            <Save size={18} />
            Сохранить изменения
          </button>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-primary hover:bg-blue-500/10 rounded-lg transition-colors"
            >
              Отмена
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default ProfileForm;

