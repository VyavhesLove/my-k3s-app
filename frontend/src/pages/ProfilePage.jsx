import React, { useState } from 'react';
import { useProfile } from '@/hooks/useProfile';

// Компоненты профиля
import ProfileTabs from './components/profile/ProfileTabs';
import ProfileInfo from './components/profile/ProfileInfo';
import ProfileForm from './components/profile/ProfileForm';
import PasswordForm from './components/profile/PasswordForm';
import AccountInfo from './components/profile/AccountInfo';
import HistoryList from './components/profile/HistoryList';
import SessionsList from './components/profile/SessionsList';

// Контейнер-оркестратор страницы профиля
const ProfilePage = () => {
  const [activeTab, setActiveTab] = useState('profile');
  const [isEditing, setIsEditing] = useState(false);

  // Используем хук для работы с данными профиля
  const {
    user,
    history,
    sessions,
    loading,
    profileForm,
    setProfileForm,
    passwordForm,
    setPasswordForm,
    handleProfileSubmit,
    handlePasswordSubmit,
    handleTerminateSession
  } = useProfile();

  // Обработчик завершения редактирования профиля
  const handleProfileUpdate = async (e) => {
    const ok = await handleProfileSubmit(e);
    if (ok) {
      setIsEditing(false);
    }
  };

  // Отмена редактирования
  const handleCancelEdit = () => {
    setIsEditing(false);
    // Восстанавливаем исходные значения из user
    if (user) {
      setProfileForm({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        email: user.email || ''
      });
    }
  };

  // Лоадер
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Заголовок */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-primary">Профиль пользователя</h1>
        <p className="text-sm opacity-60">Управление личными данными и безопасностью</p>
      </div>

      {/* Навигация по вкладкам */}
      <ProfileTabs activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Вкладка: Профиль */}
      {activeTab === 'profile' && (
        isEditing ? (
          <ProfileForm
            profileForm={profileForm}
            setProfileForm={setProfileForm}
            onSubmit={handleProfileUpdate}
            user={user}
            onCancel={handleCancelEdit}
          />
        ) : (
          <ProfileInfo user={user} />
        )
      )}

      {/* Кнопка редактирования (только для вкладки Профиль в режиме просмотра) */}
      {activeTab === 'profile' && !isEditing && (
        <button
          onClick={() => setIsEditing(true)}
          className="mt-4 flex items-center gap-2 px-4 py-2 text-blue-500 hover:bg-blue-500/10 rounded-lg transition-colors"
        >
          Редактировать профиль
        </button>
      )}

      {/* Вкладка: История */}
      {activeTab === 'history' && (
        <HistoryList history={history} />
      )}

      {/* Вкладка: Сессии */}
      {activeTab === 'sessions' && (
        <SessionsList
          sessions={sessions}
          onTerminateSession={handleTerminateSession}
        />
      )}

      {/* Вкладка: Безопасность */}
      {activeTab === 'security' && (
        <>
          <PasswordForm
            passwordForm={passwordForm}
            setPasswordForm={setPasswordForm}
            onSubmit={handlePasswordSubmit}
          />
          <AccountInfo user={user} />
        </>
      )}
    </div>
  );
};

export default ProfilePage;

