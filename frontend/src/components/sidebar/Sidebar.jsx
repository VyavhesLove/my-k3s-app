import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import { useItemStore } from '@/store/useItemStore';
import api from '@/api/axios';

import SidebarHeader from './SidebarHeader';
import SidebarMenu from './SidebarMenu';
import SidebarFooter from './SidebarFooter';
import { useSidebarStats } from './hooks/useSidebarStats';

const Sidebar = ({ isCollapsed, setIsCollapsed, isDarkMode, setIsDarkMode }) => {
  const stats = useSidebarStats();
  const [user, setUser] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();

  // Достаем selectedItem из Zustand
  const { selectedItem } = useItemStore();

  // Загрузка информации о пользователе
  useEffect(() => {
    const fetchUser = async () => {
      try {
        // Пробуем получить из localStorage (если сохраняли при логине)
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          setUser(JSON.parse(storedUser));
          return;
        }

        // Если нет в localStorage - запрашиваем с сервера
        const response = await api.get('/users/me/');
        setUser(response.data);

        // Сохраняем в localStorage
        localStorage.setItem('user', JSON.stringify(response.data));
      } catch (error) {
        console.error('Ошибка загрузки пользователя:', error);
      }
    };

    if (localStorage.getItem('accessToken')) {
      fetchUser();
    }
  }, []);

  // --- Функция определения активного пункта меню по URL ---
  const isActive = (label) => {
    const pathMap = {
      'Создать ТМЦ': '/create',
      'Аналитика': '/analytics',
      'Списание/затраты': '/writeoffs',
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

  // --- Обработчик клика по пункту меню ---
  const handleMenuClick = (label) => {
    if (label === 'Создать ТМЦ') {
      navigate('/create');
    } else if (label === 'Создать по аналогии') {
      if (!selectedItem) return toast.error('Выберите ТМЦ для копирования');
      navigate('/create', { state: { duplicateFrom: selectedItem } });
    } else if (label === 'Редактировать ТМЦ') {
      if (!selectedItem) return toast.error('Выберите ТМЦ для редактирования');
      navigate('/create', { state: { editItem: selectedItem } });
    }
    // Навигация с фильтрами
    else if (label === 'Подтвердить ТМЦ') {
      navigate('/?filter=confirm');
      toast.info('Фильтр: Ожидают подтверждения');
    } else if (label === 'Передать ТМЦ') {
      navigate('/?filter=available');
      toast.info('Фильтр: ТМЦ для передачи');
    } else if (label === 'В работу') {
      navigate('/?filter=issued');
      toast.info('Фильтр: ТМЦ выдано');
    } else if (label === 'Отправить в сервис') {
      navigate('/?filter=at_work,issued');
      toast.info('Показаны ТМЦ в работе и выданные');
    } else if (label === 'Подтвердить ремонт') {
      navigate('/?filter=confirm_repair');
      toast.info('Фильтр: Ожидание подтверждения счета');
    } else if (label === 'Вернуть из сервиса') {
      navigate('/?filter=in_repair');
      toast.info('Показаны ТМЦ в ремонте');
    } else if (label === 'Аналитика') {
      navigate('/analytics');
    } else if (label === 'Списание/затраты') {
      navigate('/writeoffs');
    }
  };
  // --------------------------------

  // --- Обработчик выхода ---
  const handleLogout = () => {
    // 1. Точечное удаление ТОЛЬКО пользовательских данных
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    localStorage.removeItem('userRole');
    localStorage.removeItem('permissions');

    // 2. Сбрасываем Zustand store в начальное состояние
    useItemStore.getState().reset();

    // 3. Уведомление
    toast.success('Выход выполнен');

    // 4. Жесткий редирект на логин
    window.location.href = '/login';
  };
  // --------------------------------

  // --- Обработчик переключения темы ---
  const handleToggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };
  // --------------------------------

  return (
    <div
      className={`flex flex-col h-screen fixed left-0 top-0 z-50 transition-all duration-300 bg-sidebar border-r border-theme
        ${isCollapsed ? 'w-20' : 'w-72'}`}
    >
      <SidebarHeader
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
        user={user}
      />

      <SidebarMenu
        isCollapsed={isCollapsed}
        isActive={isActive}
        onMenuClick={handleMenuClick}
        stats={stats}
      />

      <SidebarFooter
        isCollapsed={isCollapsed}
        isDarkMode={isDarkMode}
        onToggleTheme={handleToggleTheme}
        onLogout={handleLogout}
      />
    </div>
  );
};

export default Sidebar;

