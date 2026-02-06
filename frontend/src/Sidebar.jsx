import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { 
  PlusCircle, Copy, Edit, Send, Hammer, 
  Truck, RotateCcw, BarChart3, Trash2, 
  User, Moon, Sun, LogOut, ChevronLeft, ChevronRight, Home
} from 'lucide-react';
import ServiceModal from './components/modals/ServiceModal';
// Импортируем наше хранилище
import { useItemStore } from './store/useItemStore';

const APP_VERSION = import.meta.env.PACKAGE_VERSION || '1.0.0';

const Sidebar = ({ isCollapsed, setIsCollapsed, isDarkMode, setIsDarkMode }) => {
  const location = useLocation();
  const navigate = useNavigate();

  // --- ДОБАВЬ ЭТУ ФУНКЦИЮ ТУТ ---
  const isActive = (label) => {
    const pathMap = {
      'Создать ТМЦ': '/create',
      'Аналитика': '/analytics',
      'Списание/затраты': '/scraps',
      'В работа': '/at-work',
      'Передать ТМЦ': '/transfer'
    };
    return location.pathname === pathMap[label];
  };
  // ------------------------------

  // Достаем всё нужное из Zustand
  const {
    selectedItem, 
    isServiceModalOpen, 
    serviceMode, 
    openServiceModal, 
    closeServiceModal 
  } = useItemStore();

  const menuItems = [
    { icon: <PlusCircle size={20} />, label: 'Создать ТМЦ' },
    { icon: <Copy size={20} />, label: 'Создать по аналогии' },
    { icon: <Edit size={20} />, label: 'Редактировать ТМЦ' },
    { icon: <Send size={20} />, label: 'Передать ТМЦ' },
    { icon: <Hammer size={20} />, label: 'В работа' }, // Оставил твою опечатку "В работа"
    { icon: <Truck size={20} />, label: 'Отправить в сервис' },
    { icon: <RotateCcw size={20} />, label: 'Вернуть из сервиса' },
    { icon: <BarChart3 size={20} />, label: 'Аналитика' },
    { icon: <Trash2 size={20} />, label: 'Списание/затраты' },
    { icon: <User size={20} />, label: 'Профиль пользователя' },
  ];

  const handleMenuClick = (label) => {
    if (label === 'Создать ТМЦ') {
      navigate('/create');
    } 
    else if (label === 'Создать по аналогии') {
      if (!selectedItem) return toast.error("Выберите ТМЦ для копирования");
      navigate('/create', { state: { duplicateFrom: selectedItem } });
    }
    else if (label === 'Редактировать ТМЦ') {
      if (!selectedItem) return toast.error("Выберите ТМЦ для редактирования");
      navigate('/create', { state: { editItem: selectedItem } });
    }
    else if (label === 'Передать ТМЦ') {
      if (!selectedItem) return toast.warning("Сначала выберите ТМЦ для передачи");
      navigate('/transfer', { state: { selectedItem: selectedItem } });
    }
    // Используем Zustand для открытия модалок
    else if (label === 'Отправить в сервис') {
      if (!selectedItem) return toast.error("Выберите ТМЦ для отправки в сервис");
      openServiceModal('send'); 
    }
    else if (label === 'Вернуть из сервиса') {
      if (!selectedItem) return toast.error("Выберите ТМЦ для возврата");
      openServiceModal('return');
    }
    else if (label === 'Аналитика') navigate('/analytics');
    else if (label === 'Списание/затраты') navigate('/scraps');
    else if (label === 'В работа') navigate('/at-work');
  };

  // ... (toggleTheme остаются прежними)

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    navigate('/login');
  };

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  return (
    <>
      <div className={`flex flex-col h-screen fixed left-0 top-0 z-50 transition-all duration-300
        ${isDarkMode ? 'bg-[#1e293b] text-white border-r border-slate-700' : 'bg-white text-slate-800 border-r border-gray-200'}
        ${isCollapsed ? 'w-20' : 'w-72'}`}
      >
        {/* Шапка */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700/50">
          <Link to="/" className="flex items-center gap-3">
             <Home size={24} className={isDarkMode ? 'text-blue-400' : 'text-blue-600'} />
             {!isCollapsed && <span className="font-bold text-xl uppercase">Учёт ТМЦ</span>}
          </Link>
          <button onClick={() => setIsCollapsed(!isCollapsed)} className="p-1 hover:bg-slate-700 rounded-md">
            {isCollapsed ? <ChevronRight /> : <ChevronLeft />}
          </button>
        </div>

        {/* Навигация */}
        <nav className="flex-1 overflow-y-auto py-4">
          {menuItems.map((item, index) => (
            <div 
              key={index}
              onClick={() => handleMenuClick(item.label)}
              className={`flex items-center px-4 py-3 cursor-pointer transition-all
                ${isActive(item.label) ? 'bg-blue-600/30 text-blue-400' : 'hover:bg-blue-600/20'}`}
            >
              <div className="min-w-[24px]">{item.icon}</div>
              {!isCollapsed && <span className="ml-4 text-sm font-medium">{item.label}</span>}
            </div>
          ))}
        </nav>

        {/* Футер */}
        <div className="p-4 border-t border-slate-700/50 space-y-2">
          <button
            onClick={toggleTheme}
            className={`flex items-center w-full px-4 py-2 rounded-md hover:bg-slate-700/50 transition-all ${isDarkMode ? 'text-yellow-400' : 'text-slate-600'}`}
          >
            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            {!isCollapsed && <span className="ml-4 text-sm font-medium">{isDarkMode ? 'Светлая тема' : 'Тёмная тема'}</span>}
          </button>
          <button
            onClick={handleLogout}
            className={`flex items-center w-full px-4 py-2 rounded-md hover:bg-red-600/20 text-red-400 transition-all`}
          >
            <LogOut size={20} />
            {!isCollapsed && <span className="ml-4 text-sm font-medium">Выйти</span>}
          </button>
          {!isCollapsed && <div className="text-xs text-slate-500 text-center">Версия {APP_VERSION}</div>}
        </div>
      </div>

      {/* Модалка теперь управляется через Zustand */}
      {isServiceModalOpen && (
        <ServiceModal 
          isOpen={isServiceModalOpen}
          onClose={closeServiceModal}
          item={selectedItem}
          mode={serviceMode}
          isDarkMode={isDarkMode}
        />
      )}
    </>
  );
};

export default Sidebar;