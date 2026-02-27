import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
// ✅ Импортируем НАСТРОЕННЫЙ экземпляр axios, а не чистый!
import api from '@/api/axios';
import { useItemStore } from '@/store/useItemStore';
import { useUserRoleStore } from '@/store/useUserRoleStore';
import { toast } from 'sonner';

const LoginPage = ({ setToken, isDarkMode }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      // ✅ Используем api.post с относительным путем!
      // ⚠️ Изменено: /api/users/token/ (было /api/token/)
      const response = await api.post('users/token/', {
        username,
        password
      });
      
      // Сохраняем токены
      const { access, refresh } = response.data;
      localStorage.setItem('accessToken', access);
      localStorage.setItem('refreshToken', refresh);
      
      // ✅ Получаем и сохраняем информацию о пользователе
      const userResponse = await api.get('/users/me/');
      const userData = userResponse.data;
      
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('userRole', userData.role || 'user');
      
      // ✅ Обновляем роль в Zustand store
      useUserRoleStore.getState().refreshRole();
      
      // Передаем токен в родительский компонент App.js
      setToken(access);
      
      // ✅ ЯВНО ЗАГРУЖАЕМ ТМЦ ПОСЛЕ ЛОГИНА
      await useItemStore.getState().refreshItems();
      
      // ✅ УСПЕШНЫЙ ВХОД
      toast.success('✅ Добро пожаловать!', {
        description: `Вы вошли как ${username}`,
      });
      
      navigate('/'); // Редирект на главную
    } catch (err) {
      console.error('Login error:', err);
      console.error('Response data:', err.response?.data);
      
      // Проверяем, не заблокирован ли пользователь
      // Проверяем разные форматы ошибки
      const errorData = err.response?.data;
      let errorMessage = '';
      
      if (errorData) {
        // Новый формат от exception handler: {success: false, error: "..."}
        if (errorData.error) {
          errorMessage = errorData.error;
        }
        // Старый формат: non_field_errors
        else if (Array.isArray(errorData.non_field_errors)) {
          errorMessage = errorData.non_field_errors[0];
        } else if (typeof errorData.non_field_errors === 'string') {
          errorMessage = errorData.non_field_errors;
        } else if (errorData.detail) {
          errorMessage = errorData.detail;
        } else if (typeof errorData === 'string') {
          errorMessage = errorData;
        }
      }
      
      // Для отладки - выводим сообщение
      // console.log('Extracted error message:', errorMessage);
      
      if (errorMessage && errorMessage.includes('заблокирован')) {
        toast.error('Пользователь заблокирован');
        setError('Пользователь заблокирован');
      } else if (errorMessage && errorMessage.includes('No active user')) {
        // Это сообщение от SimpleJWT - проверяем отдельно
        toast.error('Пользователь заблокирован');
        setError('Пользователь заблокирован');
      } else if (errorMessage) {
        // Другая ошибка от сервера
        toast.error('Ошибка входа', { description: errorMessage });
        setError(errorMessage);
      } else {
        // ❌ ОШИБКА ВХОДА
        toast.error('❌ Ошибка входа', {
          description: 'Неверный логин или пароль',
        });
        setError('Неверный логин или пароль');
      }
    }
  };

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 ${
      isDarkMode ? 'bg-slate-950 text-white' : 'bg-gray-100 text-slate-900'
    }`}>
      <div className={`w-full max-w-md p-8 rounded-3xl shadow-2xl ${
        isDarkMode ? 'bg-slate-900 border border-slate-800' : 'bg-white'
      }`}>
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Склад ТМЦ</h1>
          <p className="opacity-60">Войдите в систему, используя учетную запись админа</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/50 text-red-500 rounded-xl text-sm text-center">
              {error}
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium mb-2">Логин</label>
            <input
              type="text"
              className="input-theme w-full p-3 rounded-xl border outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="admin"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Пароль</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                className="input-theme w-full p-3 pr-10 rounded-xl border outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
              >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 0.05 10 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl shadow-lg shadow-blue-600/20 transition-all active:scale-[0.98]"
          >
            Войти в систему
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;