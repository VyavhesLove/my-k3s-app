import React, { useState } from 'react';
import { X, UserPlus, Loader2 } from 'lucide-react';
import { useUserStore } from '@/store/useUserStore';
import { userCreateSchema } from '@/schemas/user';

export const CreateUserModal = ({ isOpen, onClose, isDarkMode }) => {
  const { createUser } = useUserStore();
  
  const [formData, setFormData] = useState({
    username: '',
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    confirm_password: '',
    role: 'foreman',
  });
  
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Сброс формы
  const resetForm = () => {
    setFormData({
      username: '',
      first_name: '',
      last_name: '',
      email: '',
      password: '',
      confirm_password: '',
      role: 'foreman',
    });
    setErrors({});
    setIsSubmitting(false);
  };

  // Закрытие модалки сбросом формы
  const handleClose = () => {
    resetForm();
    onClose();
  };

  // Обработчик изменения полей
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Очищаем ошибку при изменении поля
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  // Валидация формы
  const validateForm = () => {
    try {
      userCreateSchema.parse(formData);
      setErrors({});
      return true;
    } catch (error) {
      if (error.errors) {
        const newErrors = {};
        error.errors.forEach((err) => {
          newErrors[err.path[0]] = err.message;
        });
        setErrors(newErrors);
      }
      return false;
    }
  };

  // Отправка формы
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await createUser({
        username: formData.username,
        email: formData.email,
        first_name: formData.first_name || null,
        last_name: formData.last_name || null,
        role: formData.role,
        password: formData.password,
        confirm_password: formData.confirm_password,
      });

      if (result.success) {
        handleClose();
      } else {
        // Обработка ошибок от сервера
        if (result.details) {
          setErrors(result.details);
        } else if (result.error) {
          setErrors({ submit: result.error });
        }
      }
    } catch (err) {
      setErrors({ submit: err.message || 'Ошибка создания пользователя' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Оверлей */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleClose} />

      {/* Контент модалки */}
      <div className={`relative w-full max-w-md p-6 rounded-2xl shadow-2xl transition-all ${
        isDarkMode ? 'bg-slate-900 text-white border border-slate-700' : 'bg-white text-slate-900'
      }`}>
        {/* Заголовок */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <UserPlus size={24} className="text-blue-500" />
            <h2 className="text-xl font-bold">Создание пользователя</h2>
          </div>
          <button 
            onClick={handleClose} 
            className="hover:opacity-70 transition-opacity"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Логин */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Логин <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              className={`w-full p-2 rounded-lg border outline-none focus:ring-2 focus:ring-blue-500 ${
                isDarkMode 
                  ? 'bg-slate-800 border-slate-700' 
                  : 'bg-gray-50 border-gray-300'
              } ${errors.username ? 'border-red-500' : ''}`}
              placeholder="Введите логин"
            />
            {errors.username && (
              <p className="text-red-500 text-xs mt-1">{errors.username}</p>
            )}
          </div>

          {/* Имя */}
          <div>
            <label className="block text-sm font-medium mb-1">Имя</label>
            <input
              type="text"
              name="first_name"
              value={formData.first_name}
              onChange={handleChange}
              className={`w-full p-2 rounded-lg border outline-none focus:ring-2 focus:ring-blue-500 ${
                isDarkMode 
                  ? 'bg-slate-800 border-slate-700' 
                  : 'bg-gray-50 border-gray-300'
              } ${errors.first_name ? 'border-red-500' : ''}`}
              placeholder="Введите имя"
            />
            {errors.first_name && (
              <p className="text-red-500 text-xs mt-1">{errors.first_name}</p>
            )}
          </div>

          {/* Фамилия */}
          <div>
            <label className="block text-sm font-medium mb-1">Фамилия</label>
            <input
              type="text"
              name="last_name"
              value={formData.last_name}
              onChange={handleChange}
              className={`w-full p-2 rounded-lg border outline-none focus:ring-2 focus:ring-blue-500 ${
                isDarkMode 
                  ? 'bg-slate-800 border-slate-700' 
                  : 'bg-gray-50 border-gray-300'
              } ${errors.last_name ? 'border-red-500' : ''}`}
              placeholder="Введите фамилию"
            />
            {errors.last_name && (
              <p className="text-red-500 text-xs mt-1">{errors.last_name}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Почта <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className={`w-full p-2 rounded-lg border outline-none focus:ring-2 focus:ring-blue-500 ${
                isDarkMode 
                  ? 'bg-slate-800 border-slate-700' 
                  : 'bg-gray-50 border-gray-300'
              } ${errors.email ? 'border-red-500' : ''}`}
              placeholder="example@mail.ru"
            />
            {errors.email && (
              <p className="text-red-500 text-xs mt-1">{errors.email}</p>
            )}
          </div>

          {/* Пароль */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Пароль <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className={`w-full p-2 rounded-lg border outline-none focus:ring-2 focus:ring-blue-500 ${
                isDarkMode 
                  ? 'bg-slate-800 border-slate-700' 
                  : 'bg-gray-50 border-gray-300'
              } ${errors.password ? 'border-red-500' : ''}`}
              placeholder="Минимум 8 символов"
            />
            {errors.password && (
              <p className="text-red-500 text-xs mt-1">{errors.password}</p>
            )}
          </div>

          {/* Подтверждение пароля */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Подтверждение пароля <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              name="confirm_password"
              value={formData.confirm_password}
              onChange={handleChange}
              className={`w-full p-2 rounded-lg border outline-none focus:ring-2 focus:ring-blue-500 ${
                isDarkMode 
                  ? 'bg-slate-800 border-slate-700' 
                  : 'bg-gray-50 border-gray-300'
              } ${errors.confirm_password ? 'border-red-500' : ''}`}
              placeholder="Повторите пароль"
            />
            {errors.confirm_password && (
              <p className="text-red-500 text-xs mt-1">{errors.confirm_password}</p>
            )}
          </div>

          {/* Роль */}
          <div>
            <label className="block text-sm font-medium mb-1">Роль</label>
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              className={`w-full p-2 rounded-lg border outline-none focus:ring-2 focus:ring-blue-500 ${
                isDarkMode 
                  ? 'bg-slate-800 border-slate-700' 
                  : 'bg-gray-50 border-gray-300'
              }`}
            >
              <option value="admin">Администратор</option>
              <option value="storekeeper">Кладовщик</option>
              <option value="foreman">Бригадир</option>
            </select>
          </div>

          {/* Общая ошибка */}
          {errors.submit && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
              <p className="text-red-500 text-sm text-center">{errors.submit}</p>
            </div>
          )}

          {/* Кнопки */}
          <div className="flex gap-3 mt-6">
            <button
              type="button"
              onClick={handleClose}
              className={`flex-1 py-3 px-4 rounded-xl font-bold transition-colors ${
                isDarkMode 
                  ? 'bg-slate-700 hover:bg-slate-600 text-slate-200' 
                  : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
              }`}
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  Создание...
                </>
              ) : (
                'Создать'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

