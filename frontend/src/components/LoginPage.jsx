import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const LoginPage = ({ setToken, isDarkMode }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://k8s.local/api/token/', {
        username,
        password
      });
      
      // Сохраняем токены
      const { access, refresh } = response.data;
      localStorage.setItem('accessToken', access);
      localStorage.setItem('refreshToken', refresh);
      
      // Передаем токен в родительский компонент App.js
      setToken(access);
      navigate('/'); // Редирект на главную
    } catch (err) {
      setError('Неверный логин или пароль');
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