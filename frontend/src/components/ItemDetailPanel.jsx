import React from 'react';
import { useLocation } from 'react-router-dom';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { 
  X, History, Box, Tag, PlusCircle, Copy, Edit, Send, Hammer, 
  Truck, RotateCcw, BarChart3, Trash2, 
  User, Moon, Sun, LogOut, ChevronLeft, ChevronRight, Home
} from 'lucide-react';
import { statusMap, getStatusStyles } from '../constants/statusConfig';
import ServiceModal from './modals/ServiceModal';
import { useItemStore } from '../store/useItemStore';

const ItemDetailPanel = ({ item, onClose, isDarkMode, onActionClick }) => {
  const location = useLocation();
  const isOpen = !!item;

  return (
    <div className={`fixed right-0 top-0 h-full w-[400px] shadow-2xl z-50 flex flex-col transition-transform duration-300 ease-in-out ${
      isOpen ? 'translate-x-0' : 'translate-x-full'
    } ${
      isDarkMode ? 'bg-slate-900 border-l border-slate-800 text-white' : 'bg-white border-l border-gray-200 text-slate-900'
    }`}>
      {/* Шапка панели — она видна всегда, но кнопки/текст внутри защитим */}
      <div className="p-6 border-b border-gray-200 flex justify-between items-center relative z-10">
        <h2 className="text-xl font-bold uppercase tracking-tight">Детали ТМЦ</h2>
        <button 
          type="button"
          onClick={(e) => { 
            e.stopPropagation(); 
            onClose(); 
          }} 
          className="p-2 hover:bg-gray-500/10 rounded-full transition-colors"
        >
          <X size={24} />
        </button>
      </div>

      {/* Контент — общая обертка без глобального скролла */}
      {item && (
        <div className="flex-1 flex flex-col min-h-0 p-6 space-y-6">
          
          {/* 1. СТАТИЧНЫЙ БЛОК: Статус и Детали */}
          <section className="space-y-6">
            <div>
              <div className="text-sm text-gray-500 uppercase font-semibold mb-3">Текущий статус</div>
              <div className={`p-4 rounded-2xl font-bold text-center uppercase tracking-wider ${getStatusStyles(item?.status, isDarkMode)}`}>
                {statusMap[item?.status] || item?.status}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <DetailRow label="Наименование" value={item?.name} />
              <DetailRow label="Серийный номер" value={item?.serial || '—'} />
              <DetailRow label="Бригада" value={item?.brigade_details?.name || 'Не закреплено'} />
            </div>
          </section>

          {/* 2. СТАТИЧНЫЙ БЛОК: Кнопка действия с проверкой всех состояний */}
          <section className="py-2">
            {/* 1. Если ТМЦ свободен или в работе -> кнопка "Отправить" */}
            {(item.status === 'issued' || item.status === 'at_work') && (
              <button
                onClick={() => onActionClick(item, 'send')}
                className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold transition-all shadow-lg shadow-blue-900/20 active:scale-95"
              >
                Отправить в сервис
              </button>
            )}

            {/* 2. Если ждет подтверждения -> кнопка "Подтвердить" */}
            {item.status === 'confirm_repair' && (
              <button
                onClick={() => onActionClick(item, 'confirm')}
                className="w-full py-4 bg-amber-500 hover:bg-amber-400 text-white rounded-xl font-bold transition-all shadow-lg shadow-amber-900/20 active:scale-95"
              >
                Подтвердить ремонт
              </button>
            )}

            {/* 3. Если уже в ремонте -> кнопка "Вернуть" */}
            {(item.status === 'repair' || item.status === 'in_service') && (
              <button
                onClick={() => onActionClick(item, 'return')}
                className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold transition-all shadow-lg shadow-emerald-900/20 active:scale-95"
              >
                Принять из ремонта
              </button>
            )}

            {/* Подпись под кнопкой */}
            <p className="text-[10px] text-center mt-2 opacity-50 uppercase font-bold text-gray-400">
              {item.status === 'confirm_repair' ? 'Требуется заполнение данных о ремонте' : 'Нажмите для выбора действия'}
            </p>
          </section>

          {/* 3. СКРОЛЛИРУЕМЫЙ БЛОК: Только история */}
          <section className="flex-1 flex flex-col min-h-0 border-t border-gray-500/10 pt-4">
            <div className="flex items-center gap-2 text-sm text-gray-500 uppercase font-semibold mb-4">
              <History size={16} /> Последние операции
            </div>
            
            {/* Вот этот контейнер будет скроллиться сам по себе */}
            <div className="flex-1 overflow-y-auto min-h-0 rounded-xl border border-gray-500/20 custom-scrollbar">
              <table className="w-full text-xs text-left border-collapse">
                <thead className={`sticky top-0 z-10 ${isDarkMode ? 'bg-slate-800' : 'bg-gray-50'}`}>
                  <tr>
                    <th className="p-3 font-bold border-b border-gray-500/10">Дата</th>
                    <th className="p-3 font-bold border-b border-gray-500/10">Операция</th>
                    <th className="p-3 font-bold border-b border-gray-500/10">Отв.</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-500/10">
                  {item?.history?.map((h, i) => (
                    <tr key={i} className={isDarkMode ? 'hover:bg-slate-800/50' : 'hover:bg-gray-50'}>
                      <td className="p-3 whitespace-nowrap opacity-70">{h.date}</td>
                      <td className="p-3 leading-relaxed">{h.action}</td>
                      <td className="p-3 font-medium">{h.user}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {(!item?.history || item.history.length === 0) && (
                <div className="p-8 text-center text-gray-500 italic text-sm">
                  История операций пуста
                </div>
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  );
};

const DetailRow = ({ label, value }) => (
  <div className="space-y-1">
    <div className="text-[10px] uppercase text-gray-500 font-bold">{label}</div>
    <div className="text-sm font-medium">{value}</div>
  </div>
);

export const Sidebar = ({ isCollapsed, setIsCollapsed, isDarkMode, setIsDarkMode, selectedItem }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { serviceMode, isServiceModalOpen, openServiceModal, closeServiceModal } = useItemStore();

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
    else if (label === 'В работа') {
      navigate('/at-work');
    }
    // -------------------------------------------------
    // Новые обработчики для сервисных операций
    // -------------------------------------------------
    else if (label === 'Отправить в сервис') {
      if (!selectedItem) {
        return toast.error("Выберите ТМЦ для отправки в сервис");
      }
      openServiceModal('send');
    }
    else if (label === 'Вернуть из сервиса') {
      if (!selectedItem) {
        return toast.error("Выберите ТМЦ для возврата");
      }
      // При необходимости можно добавить проверку статуса "В сервисе"
      openServiceModal('return');
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

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    window.location.href = '/login';
  };

  return (
    <>
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
          <button 
            onClick={handleLogout}
            className="w-full flex items-center px-2 py-2 text-slate-400 hover:text-red-400 transition-colors group"
          >
            <LogOut size={20} />
            {!isCollapsed && <span className="ml-4 text-sm font-medium">Выйти</span>}
          </button>

          {/* Версия приложения */}
          <div className="mt-auto p-4 text-xs opacity-50 font-mono">
            v{APP_VERSION}
          </div>
        </div>
      </div>

      {/* Модалка сервиса */}
      {isServiceModalOpen && selectedItem && (
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

export default ItemDetailPanel;
