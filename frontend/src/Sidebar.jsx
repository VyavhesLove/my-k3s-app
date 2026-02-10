import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { 
  PlusCircle, Copy, Edit, Send, ShieldCheck, Hammer, 
  Truck, RotateCcw, BarChart3, Trash2, 
  User, Moon, Sun, LogOut, ChevronLeft, ChevronRight, Home, Wrench
} from 'lucide-react';
// Импортируем наше хранилище
import { useItemStore } from './store/useItemStore';
import api from './api/axios';

const APP_VERSION = import.meta.env.PACKAGE_VERSION || '1.0.0';

// Функция для получения текущего времени в Екатеринбурге (+5)
const getYekaterinburgTime = () => {
  return new Date().toLocaleString('ru-RU', {
    timeZone: 'Asia/Yekaterinburg',
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

const Sidebar = ({ isCollapsed, setIsCollapsed, isDarkMode, setIsDarkMode }) => {
  // Состояние для отображения времени
  const [currentTime, setCurrentTime] = React.useState(getYekaterinburgTime());

  // Обновление времени каждую минуту
  React.useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(getYekaterinburgTime());
    }, 60000);
    return () => clearInterval(interval);
  }, []);
  // Состояние для счетчиков
  const [stats, setStats] = React.useState({ to_receive: 0, to_repair: 0 /*, issued: 0 */ });

  // Загрузка счетчиков с сервера
  React.useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await api.get('/status-counters/');
        setStats({
          to_receive: response.data.to_receive || 0,
          to_repair: response.data.to_repair || 0,
          // issued: response.data.issued || 0
        });
      } catch (error) {
        console.error('Ошибка загрузки счетчиков:', error);
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);
  const location = useLocation();
  const navigate = useNavigate();

  // --- Функция определения активного пункта меню по URL ---
  const isActive = (label) => {
    const pathMap = {
      'Создать ТМЦ': '/create',
      'Аналитика': '/analytics',
      'Списание/затраты': '/scraps',
    };
    
    // Проверяем pathname для маршрутов
    if (pathMap[label]) {
      return location.pathname === pathMap[label];
    }
    
    // Проверяем search для фильтров - точное совпадение
    const filterMap = {
      'Подтвердить ТМЦ': 'confirm',
      'Передать ТМЦ': 'available',
      'В работу': 'issued',
      'Отправить в сервис': 'at_work,issued',
      'Вернуть из сервиса': 'in_repair',
      'Подтвердить ремонт': 'confirm_repair',
    };
    
    if (filterMap[label]) {
      const searchParams = new URLSearchParams(location.search);
      const currentFilter = searchParams.get('filter');
      return currentFilter === filterMap[label];
    }
    
    return false;
  };
  // --------------------------------

  // Достаем всё нужное из Zustand
  const {
    selectedItem
  } = useItemStore();

  const menuItems = [
    { icon: <PlusCircle size={20} />, label: 'Создать ТМЦ' },
    { icon: <Copy size={20} />, label: 'Создать по аналогии' },
    { icon: <Edit size={20} />, label: 'Редактировать ТМЦ' },
    { icon: <ShieldCheck size={20} />, label: 'Подтвердить ТМЦ' },
    { icon: <Send size={20} />, label: 'Передать ТМЦ' },
    { icon: <Hammer size={20} />, label: 'В работу' },
    { icon: <Truck size={20} />, label: 'Отправить в сервис' },
    { icon: <RotateCcw size={20} />, label: 'Вернуть из сервиса' },
    { icon: <Wrench size={20} />, label: 'Подтвердить ремонт' },
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
    // Навигация с фильтрами
    else if (label === 'Подтвердить ТМЦ') {
      navigate('/?filter=confirm');
      toast.info("Фильтр: Ожидают подтверждения");
    }
    else if (label === 'Передать ТМЦ') {
      navigate('/?filter=available');
      toast.info("Фильтр: ТМЦ для передачи");
    }
    else if (label === 'В работу') {
      navigate('/?filter=issued');
      toast.info("Фильтр: ТМЦ выдано");
    }
    else if (label === 'Отправить в сервис') {
      navigate('/?filter=at_work,issued');
      toast.info("Показаны ТМЦ в работе и выданные");
    }
    else if (label === 'Вернуть из сервиса') {
      navigate('/?filter=in_repair');
      toast.info("Показаны ТМЦ в ремонте");
    }
    else if (label === 'Подтвердить ремонт') {
      navigate('/?filter=confirm_repair');
      toast.info("Фильтр: Ожидание подтверждения счета");
    }
    else if (label === 'Аналитика') navigate('/analytics');
    else if (label === 'Списание/затраты') navigate('/scraps');
    // else if (label === 'Профиль пользователя') navigate('/profile');
  };

  // ... (toggleTheme остаются прежними)

  const handleLogout = () => {
    // 1. Чистим всё хранилище
    localStorage.clear();
    
    toast.success("Выход выполнен");

    // 2. Жёсткий редирект на страницу логина
    window.location.href = '/login';
  };

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  // Функция для отрисовки индикатора счетчика
  const renderBadge = (label) => {
    const countMap = {
      'Подтвердить ТМЦ': { count: stats.to_receive, color: 'bg-amber-500', pulse: true },
      'Подтвердить ремонт': { count: stats.to_repair, color: 'bg-amber-600', pulse: true },
      // 'В работу': { count: stats.issued, color: 'bg-sky-500', pulse: false }
    };

    const badge = countMap[label];
    if (!badge || badge.count === 0) return null;

    if (isCollapsed) {
      return (
        <div className={`absolute top-1 right-1 w-2.5 h-2.5 rounded-full border-2 border-slate-900 ${badge.color} ${badge.pulse ? 'badge-pulse' : ''}`} />
      );
    }

    return (
      <span className={`ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full text-white shadow-sm transition-all ${badge.color} ${badge.pulse ? 'ring-2 ring-amber-500/20' : ''}`}>
        {badge.count}
      </span>
    );
  };

  return (
    <>
      <div className={`flex flex-col h-screen fixed left-0 top-0 z-50 transition-all duration-300 bg-sidebar border-r border-theme
        ${isCollapsed ? 'w-20' : 'w-72'}`}
      >
        {/* Шапка */}
        <div className="flex items-center justify-between p-4 border-b border-theme">
          <Link to="/" className="flex items-center gap-3 text-primary">
             <Home size={24} className="text-blue-500" />
             {!isCollapsed && <span className="font-bold text-xl uppercase">Учёт ТМЦ</span>}
          </Link>
          <button onClick={() => setIsCollapsed(!isCollapsed)} className="p-1 rounded-md transition-colors hover:bg-blue-500/10">
            {isCollapsed ? <ChevronRight className="text-primary" /> : <ChevronLeft className="text-primary" />}
          </button>
        </div>

        {/* Навигация */}
        <nav className="flex-1 mt-4 overflow-y-auto no-scrollbar">
          {menuItems.map((item, index) => (
            <div
              key={index}
              onClick={() => handleMenuClick(item.label)}
              className={`relative flex items-center px-4 py-3 cursor-pointer transition-all text-primary
                ${isActive(item.label) 
                  ? 'bg-blue-600/30 text-blue-400 border-r-2 border-blue-500' 
                  : 'hover:bg-blue-500/10'
                }`}
            >
              <div className="relative min-w-[24px]">
                {item.icon}
                {isCollapsed && renderBadge(item.label)} 
              </div>
              
              {!isCollapsed && (
                <>
                  <span className="ml-4 text-sm font-medium whitespace-nowrap">{item.label}</span>
                  {renderBadge(item.label)}
                </>
              )}
            </div>
          ))}
        </nav>

        {/* Футер */}
        <div className="p-4 border-t border-theme space-y-2">
          <button
            onClick={toggleTheme}
            className={`flex items-center w-full px-4 py-2 rounded-md transition-all text-primary hover:bg-blue-500/10`}
          >
            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            {!isCollapsed && <span className="ml-4 text-sm font-medium">{isDarkMode ? 'Светлая тема' : 'Тёмная тема'}</span>}
          </button>
          <button
            onClick={handleLogout}
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
      </div>
    </>
  );
};

export default Sidebar;
