import { Settings } from 'lucide-react';

const UserInfo = ({ user, isCollapsed, onNavigateToProfile }) => {
  if (!user) return null;

  // Функция для получения текста роли
  const getRoleText = (role) => {
    switch (role) {
      case 'storekeeper':
        return 'Кладовщик';
      case 'admin':
        return 'Администратор';
      case 'foreman':
        return 'Бригадир';
      default:
        return 'Пользователь';
    }
  };

  // Определение цвета индикатора роли
  const getRoleIndicatorClass = (role) => {
    switch (role) {
      case 'storekeeper':
        return 'bg-green-500';
      case 'admin':
        return 'bg-red-500';
      case 'foreman':
        return 'bg-orange-500';
      default:
        return 'bg-blue-500';
    }
  };

  // Обработчик клика по профилю
  const handleProfileClick = () => {
    if (onNavigateToProfile) {
      onNavigateToProfile();
    }
  };

  const roleIndicatorClass = getRoleIndicatorClass(user.role);

  if (isCollapsed) {
    return (
      <div className="mt-3 flex justify-center">
        <button
          onClick={handleProfileClick}
          className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-xs hover:ring-2 hover:ring-blue-400 hover:ring-offset-2 hover:ring-offset-sidebar transition-all cursor-pointer"
        >
          {user.username?.charAt(0).toUpperCase() || 'U'}
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={handleProfileClick}
      className="mt-3 flex items-center gap-3 px-2 py-2 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 cursor-pointer transition-colors w-full text-left"
    >
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
        {user.username?.charAt(0).toUpperCase() || 'U'}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium truncate text-primary">
          {user.username || 'Загрузка...'}
        </div>
        <div className="text-xs opacity-60 flex items-center gap-1">
          <span className={`inline-block w-2 h-2 rounded-full ${roleIndicatorClass} animate-pulse`}></span>
          {getRoleText(user.role)}
        </div>
      </div>
      <Settings size={16} className="text-primary opacity-40 hover:opacity-70 transition-opacity" />
    </button>
  );
};

export default UserInfo;

