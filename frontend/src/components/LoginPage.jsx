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
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      // ✅ Используем api.post с относительным путем!
      const response = await api.post('token/', {
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
            <input
              type="password"
              className="input-theme w-full p-3 rounded-xl border outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
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