import {
  PlusCircle, Copy, Edit, Send, ShieldCheck, Hammer,
  Truck, RotateCcw, BarChart3, Trash2, User, Wrench
} from 'lucide-react';
import MenuItem from './MenuItem';

const SidebarMenu = ({ isCollapsed, isActive, onMenuClick, stats }) => {
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

  return (
    <nav className="flex-1 mt-4 overflow-y-auto no-scrollbar">
      {menuItems.map((item, index) => (
        <MenuItem
          key={index}
          item={item}
          isActive={isActive(item.label)}
          isCollapsed={isCollapsed}
          onClick={onMenuClick}
          stats={stats}
        />
      ))}
    </nav>
  );
};

export default SidebarMenu;

