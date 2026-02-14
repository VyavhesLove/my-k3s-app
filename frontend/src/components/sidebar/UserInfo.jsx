const UserInfo = ({ user, isCollapsed }) => {
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

  const roleIndicatorClass = getRoleIndicatorClass(user.role);

  if (isCollapsed) {
    return (
      <div className="mt-3 flex justify-center">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-xs">
          {user.username?.charAt(0).toUpperCase() || 'U'}
        </div>
      </div>
    );
  }

  return (
    <div className="mt-3 flex items-center gap-3 px-2 py-2 rounded-lg bg-blue-500/10">
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
    </div>
  );
};

export default UserInfo;

