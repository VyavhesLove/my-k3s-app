import { useState, useEffect } from 'react';
import { Moon, Sun, LogOut } from 'lucide-react';

const APP_VERSION = import.meta.env.PACKAGE_VERSION || '1.0.0';

// Функция для получения текущего времени в Екатеринбурге (+5)
const getYekaterinburgTime = () => {
  return new Date().toLocaleString('ru-RU', {
    timeZone: 'Asia/Yekaterinburg',
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

const SidebarFooter = ({ isCollapsed, isDarkMode, onToggleTheme, onLogout }) => {
  const [currentTime, setCurrentTime] = useState(getYekaterinburgTime());

  // Обновление времени каждую минуту
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(getYekaterinburgTime());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="p-4 border-t border-theme space-y-2">
      <button
        onClick={onToggleTheme}
        className={`flex items-center w-full px-4 py-2 rounded-md transition-all text-primary hover:bg-blue-500/10`}
      >
        {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
        {!isCollapsed && (
          <span className="ml-4 text-sm font-medium">
            {isDarkMode ? 'Светлая тема' : 'Тёмная тема'}
          </span>
        )}
      </button>

      <button
        onClick={onLogout}
        className={`flex items-center w-full px-4 py-2 rounded-md transition-all text-primary hover:bg-red-500/10`}
      >
        <LogOut size={20} className="text-red-500" />
        {!isCollapsed && <span className="ml-4 text-sm font-medium">Выйти</span>}
      </button>

      {!isCollapsed && (
        <div className="flex flex-col items-center gap-1 text-xs text-primary opacity-60">
          <div>Версия {APP_VERSION}</div>
          <div className="text-[10px]">{currentTime}</div>
        </div>
      )}
    </div>
  );
};

export default SidebarFooter;

