import React from 'react';
import { Lock } from 'lucide-react';

// Компонент формы смены пароля
const PasswordForm = ({ passwordForm, setPasswordForm, onSubmit }) => {
  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(e);
  };

  return (
    <div className="bg-card rounded-lg p-6 border border-theme">
      <h2 className="text-lg font-semibold mb-4 text-primary flex items-center gap-2">
        <Lock size={20} />
        Смена пароля
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
        <div>
          <label className="block text-sm font-medium mb-1 text-primary">
            Текущий пароль
          </label>
          <input
            type="password"
            value={passwordForm.current_password}
            onChange={(e) => setPasswordForm({ ...passwordForm, current_password: e.target.value })}
            className="w-full px-3 py-2 rounded-lg input-theme"
            placeholder="Введите текущий пароль"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1 text-primary">
            Новый пароль
          </label>
          <input
            type="password"
            value={passwordForm.new_password}
            onChange={(e) => setPasswordForm({ ...passwordForm, new_password: e.target.value })}
            className="w-full px-3 py-2 rounded-lg input-theme"
            placeholder="Минимум 8 символов"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1 text-primary">
            Подтверждение пароля
          </label>
          <input
            type="password"
            value={passwordForm.confirm_password}
            onChange={(e) => setPasswordForm({ ...passwordForm, confirm_password: e.target.value })}
            className="w-full px-3 py-2 rounded-lg input-theme"
            placeholder="Повторите новый пароль"
            required
          />
        </div>

        <button
          type="submit"
          className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          <Lock size={18} />
          Изменить пароль
        </button>
      </form>
    </div>
  );
};

export default PasswordForm;

