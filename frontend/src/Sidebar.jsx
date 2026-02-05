import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { 
  PlusCircle, Copy, Edit, Send, Hammer, 
  Truck, RotateCcw, BarChart3, Trash2, 
  User, Moon, Sun, LogOut, ChevronLeft, ChevronRight, Home
} from 'lucide-react';

const APP_VERSION = import.meta.env.PACKAGE_VERSION || '1.0.0';

const Sidebar = ({ isCollapsed, setIsCollapsed, isDarkMode, setIsDarkMode, selectedItem }) => {
  const location = useLocation();
  const navigate = useNavigate();

  // Список пунктов меню согласно ТЗ
  const menuItems = [
    { icon: <PlusCircle size={20} />, label: 'Создать ТМЦ' },
    { icon: <Copy size={20} />, label: 'Создать по аналогии' },
    { icon: <Edit size={20} />, label: 'Редактировать ТМЦ' },
    { icon: <Send size={20} />, label: 'Передать ТМЦ' },
    { icon: <Hammer size={20} />, label: 'В работу' },
    { icon: <Truck size={20} />, label: 'Отправить в сервис' },
    { icon: <RotateCcw size={20} />, label: 'Вернуть из сервиса' },
    { icon: <BarChart3 size={20} />, label: 'Аналитика' },
    { icon: <Trash2 size={20} />, label: 'Списание/затраты' },
    { icon: <User size={20} />, label: 'Профиль пользователя' },
  ];

  const toggleTheme = () => {
    if (setIsDarkMode) setIsDarkMode(!isDarkMode);
  };

  const handleMenuClick = (label) => {
    if (label === 'Создать ТМЦ') {
      navigate('/create');
    } 
    else if (label === 'Создать по аналогии') {
      if (!selectedItem) {
        return toast.error("Выберите ТМЦ в списке для копирования", {
          id: 'selection-error'
        });
      }
      navigate('/create', { state: { duplicateFrom: selectedItem } });
    }
    else if (label === 'Редактировать ТМЦ') {
      if (!selectedItem) {
        return toast.error("Выберите ТМЦ для редактирования", {
          id: 'selection-error'
        });
      }
      navigate('/create', { state: { editItem: selectedItem } });
    }
    else if (label === 'Передать ТМЦ') {
      if (!selectedItem) {
        return toast.warning("Сначала выберите ТМЦ для передачи", {
          id: 'selection-error',
          description: "Кликните на строку в таблице списка"
        });
      }
      navigate('/transfer', { state: { selectedItem: selectedItem } });
    }
    else if (label === 'Аналитика') {
      navigate('/analytics');
    }
    else if (label === 'Списание/затраты') {
      navigate('/scraps');
    }
    else if (label === 'В работу') {
      navigate('/at-work');
    }
  };

  const getMenuPath = (label) => {
    if (label === 'Создать ТМЦ') return '/create';
    if (label === 'Передать ТМЦ') return '/transfer';
    if (label === 'Аналитика') return '/analytics';
    if (label === 'В работе') return '/at-work';
    return '/';
  };

  // Логика подсветки активного пункта меню
  const isActive = (label) => {
    if (label === 'Создать ТМЦ') return location.pathname === '/create' && !location.state;
    if (label === 'Аналитика') return location.pathname === '/analytics';
    if (label === 'В работе') return location.pathname === '/at-work';
    if (label === 'Передать ТМЦ') return location.pathname === '/transfer';
    if (label === 'Создать по аналогии') return location.pathname === '/create' && location.state?.duplicateFrom;
    if (label === 'Редактировать ТМЦ') return location.pathname === '/create' && location.state?.editItem;
    
    // Для главной страницы
    if (label === 'Список ТМЦ') return location.pathname === '/';
    
    return false;
  };

  return (
    <div className={`flex flex-col h-screen transition-all duration-300 shadow-xl fixed left-0 top-0 z-50
      ${isDarkMode ? 'bg-[#1e293b] text-white border-r border-slate-700' : 'bg-white text-slate-800 border-r border-gray-200'}
      ${isCollapsed ? 'w-20' : 'w-72'}`}
    >
      {/* Шапка меню */}
      <div className="flex items-center justify-between p-4 border-b border-slate-700/50">
        <Link 
          to="/" 
          state={{ resetFilters: true }}
          className={`flex items-center gap-3 hover:opacity-80 transition-opacity ${isCollapsed ? 'justify-center' : ''}`}
        >
          <Home 
            size={24} 
            className={`${isDarkMode ? 'text-blue-400' : 'text-blue-600'} flex-shrink-0`} 
          />
          {!isCollapsed && (
            <span className={`font-bold text-xl tracking-wide uppercase hover:text-blue-500 transition-colors duration-200`}>
              Учёт ТМЦ
            </span>
          )}
        </Link>
        <button 
          onClick={() => setIsCollapsed && setIsCollapsed(!isCollapsed)}
          className="p-1 hover:bg-slate-700 rounded-md transition-colors"
        >
          {isCollapsed ? <ChevronRight /> : <ChevronLeft />}
        </button>
      </div>

{/* Основные пункты */}
      <nav className="flex-1 overflow-y-auto py-4 space-y-1">
        {menuItems.map((item, index) => (
          <div 
            key={index}
            onClick={() => handleMenuClick(item.label)}
            className={`flex items-center px-4 py-3 cursor-pointer transition-all group
              ${isActive(item.label) ? 'bg-blue-600/30 text-blue-400' : 'hover:bg-blue-600/20'}`}
          >
            <div className="min-w-[24px]">{item.icon}</div>
            {!isCollapsed && <span className="ml-4 text-sm font-medium">{item.label}</span>}
          </div>
        ))}
      </nav>

      {/* Футер: Тема и Выход */}
      <div className="p-4 border-t border-slate-700/50 space-y-2">
        {/* Кнопка смены темы */}
        <button 
          onClick={toggleTheme}
          className={`w-full flex items-center justify-center gap-2 py-2 rounded-lg transition-all border
            ${isDarkMode ? 'bg-white text-black border-transparent' : 'bg-slate-800 text-white border-slate-600'}`}
        >
          {isDarkMode ? <Sun size={18} fill="currentColor" /> : <Moon size={18} />}
          {!isCollapsed && <span className="font-semibold">{isDarkMode ? 'Светлая' : 'Тёмная'}</span>}
        </button>

        {/* Кнопка Выйти */}
        <button className="w-full flex items-center px-2 py-2 text-slate-400 hover:text-red-400 transition-colors group">
          <LogOut size={20} />
          {!isCollapsed && <span className="ml-4 text-sm font-medium">Выйти</span>}
        </button>

        {/* Версия приложения */}
        <div className="mt-auto p-4 text-xs opacity-50 font-mono">
          v{APP_VERSION}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;

