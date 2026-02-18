import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { 
  User, 
  Mail, 
  Shield, 
  Clock, 
  History, 
  LogOut, 
  Lock, 
  Save,
  Monitor,
  Smartphone,
  Globe,
  X
} from 'lucide-react';
import api from '@/api/axios';

const ProfilePage = ({ isDarkMode, onNavigate }) => {
  const [user, setUser] = useState(null);
  const [history, setHistory] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Форма профиля
  const [profileForm, setProfileForm] = useState({
    first_name: '',
    last_name: '',
    email: ''
  });
  
  // Форма смены пароля
  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });
  
  const [activeTab, setActiveTab] = useState('profile');

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const [userRes, historyRes, sessionsRes] = await Promise.all([
        api.get('/users/me/'),
        api.get('/users/me/history/'),
        api.get('/users/me/sessions/')
      ]);
      
      setUser(userRes.data);
      setHistory(historyRes.data);
      setSessions(sessionsRes.data);
      
      // Заполняем форму профиля
      setProfileForm({
        first_name: userRes.data.first_name || '',
        last_name: userRes.data.last_name || '',
        email: userRes.data.email || ''
      });
    } catch (error) {
      toast.error('Ошибка загрузки данных профиля');
    } finally {
      setLoading(false);
    }
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.put('/users/me/update/', profileForm);
      toast.success('Профиль обновлён');
      fetchUserData();
    } catch (error) {
      const errorMsg = error.response?.data?.error || 'Ошибка обновления профиля';
      toast.error(errorMsg);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      toast.error('Пароли не совпадают');
      return;
    }
    
    if (passwordForm.new_password.length < 8) {
      toast.error('Пароль должен содержать минимум 8 символов');
      return;
    }

    try {
      await api.post('/users/me/change-password/', {
        current_password: passwordForm.current_password,
        new_password: passwordForm.new_password,
        confirm_password: passwordForm.confirm_password
      });
      toast.success('Пароль успешно изменён');
      setPasswordForm({
        current_password: '',
        new_password: '',
        confirm_password: ''
      });
    } catch (error) {
      const errorMsg = error.response?.data?.error || 'Ошибка смены пароля';
      toast.error(errorMsg);
    }
  };

  const handleTerminateSession = async (sessionId) => {
    try {
      await api.post('/users/me/sessions/terminate/', { session_id: sessionId });
      toast.success('Сессия завершена');
      fetchUserData();
    } catch (error) {
      toast.error('Ошибка завершения сессии');
    }
  };

  const getDeviceIcon = (userAgent) => {
    if (!userAgent) return <Monitor size={16} />;
    const ua = userAgent.toLowerCase();
    if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
      return <Smartphone size={16} />;
    }
    return <Monitor size={16} />;
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const getRoleText = (role) => {
    switch (role) {
      case 'admin': return 'Администратор';
      case 'storekeeper': return 'Кладовщик';
      case 'foreman': return 'Бригадир';
      default: return 'Пользователь';
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Заголовок */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-primary">Профиль пользователя</h1>
        <p className="text-sm opacity-60">Управление личными данными и безопасностью</p>
      </div>

      {/* Навигация по вкладкам */}
      <div className="flex gap-2 mb-6 border-b border-theme pb-2">
        <button
          onClick={() => setActiveTab('profile')}
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
          onClick={() => setActiveTab('history')}
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
          onClick={() => setActiveTab('sessions')}
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
          onClick={() => setActiveTab('security')}
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

      {/* Вкладка: Профиль */}
      {activeTab === 'profile' && (
        <div className="bg-card rounded-lg p-6 border border-theme">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-3xl font-bold">
              {user?.username?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div>
              <h2 className="text-xl font-bold text-primary">{user?.username}</h2>
              <p className="text-sm opacity-60 flex items-center gap-2">
                <Shield size={14} className="text-blue-500" />
                {getRoleText(user?.role)}
              </p>
            </div>
          </div>

          <form onSubmit={handleProfileSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-primary">
                  Имя
                </label>
                <input
                  type="text"
                  value={profileForm.first_name}
                  onChange={(e) => setProfileForm({...profileForm, first_name: e.target.value})}
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
                  onChange={(e) => setProfileForm({...profileForm, last_name: e.target.value})}
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
                  onChange={(e) => setProfileForm({...profileForm, email: e.target.value})}
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

            <button
              type="submit"
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              <Save size={18} />
              Сохранить изменения
            </button>
          </form>
        </div>
      )}

      {/* Вкладка: История */}
      {activeTab === 'history' && (
        <div className="bg-card rounded-lg p-6 border border-theme">
          <h2 className="text-lg font-semibold mb-4 text-primary flex items-center gap-2">
            <History size={20} />
            История последних операций
          </h2>
          
          {history.length === 0 ? (
            <p className="text-center py-8 opacity-60">История операций пуста</p>
          ) : (
            <div className="space-y-3">
              {history.map((item) => (
                <div 
                  key={item.id} 
                  className="flex items-start gap-3 p-3 rounded-lg bg-blue-500/5 border border-theme hover:bg-blue-500/10 transition-colors"
                >
                  <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                    <History size={18} className="text-blue-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-primary truncate">{item.action || 'Действие'}</p>
                    {item.item_name && (
                      <p className="text-sm opacity-60">ТМЦ: {item.item_name}</p>
                    )}
                    <p className="text-xs opacity-40 mt-1">
                      <Clock size={12} className="inline mr-1" />
                      {formatDate(item.timestamp)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Вкладка: Сессии */}
      {activeTab === 'sessions' && (
        <div className="bg-card rounded-lg p-6 border border-theme">
          <h2 className="text-lg font-semibold mb-4 text-primary flex items-center gap-2">
            <Shield size={20} />
            Активные сессии
          </h2>
          <p className="text-sm opacity-60 mb-4">
            Управляйте устройствами, на которых выполнен вход в аккаунт
          </p>
          
          {sessions.length === 0 ? (
            <p className="text-center py-8 opacity-60">Нет активных сессий</p>
          ) : (
            <div className="space-y-3">
              {sessions.map((session) => (
                <div 
                  key={session.id} 
                  className="flex items-center gap-3 p-4 rounded-lg bg-blue-500/5 border border-theme"
                >
                  <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                    {getDeviceIcon(session.user_agent)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-primary">
                        {session.description || 'Устройство'}
                      </p>
                      {session.is_current && (
                        <span className="px-2 py-0.5 text-xs bg-green-500/20 text-green-500 rounded-full">
                          Текущая
                        </span>
                      )}
                    </div>
                    <p className="text-sm opacity-60 flex items-center gap-1">
                      <Globe size={12} />
                      {session.ip_address || 'IP неизвестен'}
                    </p>
                    <p className="text-xs opacity-40 mt-1">
                      Последняя активность: {formatDate(session.last_activity)}
                    </p>
                  </div>
                  {!session.is_current && (
                    <button
                      onClick={() => handleTerminateSession(session.id)}
                      className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                      title="Завершить сессию"
                    >
                      <LogOut size={18} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Вкладка: Безопасность */}
      {activeTab === 'security' && (
        <div className="bg-card rounded-lg p-6 border border-theme">
          <h2 className="text-lg font-semibold mb-4 text-primary flex items-center gap-2">
            <Lock size={20} />
            Смена пароля
          </h2>
          
          <form onSubmit={handlePasswordSubmit} className="space-y-4 max-w-md">
            <div>
              <label className="block text-sm font-medium mb-1 text-primary">
                Текущий пароль
              </label>
              <input
                type="password"
                value={passwordForm.current_password}
                onChange={(e) => setPasswordForm({...passwordForm, current_password: e.target.value})}
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
                onChange={(e) => setPasswordForm({...passwordForm, new_password: e.target.value})}
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
                onChange={(e) => setPasswordForm({...passwordForm, confirm_password: e.target.value})}
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

          <div className="mt-8 pt-6 border-t border-theme">
            <h3 className="text-md font-semibold mb-3 text-primary">Информация об аккаунте</h3>
            <div className="space-y-2 text-sm">
              <p className="flex items-center gap-2 text-primary">
                <Clock size={14} className="opacity-60" />
                Дата регистрации: <span className="opacity-60">{formatDate(user?.date_joined)}</span>
              </p>
              <p className="flex items-center gap-2 text-primary">
                <History size={14} className="opacity-60" />
                Последний вход: <span className="opacity-60">{formatDate(user?.last_activity)}</span>
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;

