import React, { useState, useEffect } from 'react';
import { Bell, ChevronDown, ChevronUp, PackageCheck, Wrench, Send } from 'lucide-react';
import api from '../api/axios';

const QuickActions = ({ isDarkMode }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [stats, setStats] = useState({ to_receive: 0, to_repair: 0, issued: 0 });

  useEffect(() => {
    // Загружаем реальные данные из API
    const fetchStats = async () => {
      try {
        const response = await api.get('/status-counters');
        setStats({
          to_receive: response.data.to_receive || 0,
          to_repair: response.data.to_repair || 0,
          issued: response.data.issued || 0
        });
      } catch (error) {
        console.error('Ошибка загрузки счетчиков:', error);
      }
    };

    fetchStats();
    // Обновляем данные каждые 30 секунд
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const ActionButton = ({ icon: Icon, label, count, colorClass, onClick }) => (
    <button 
      onClick={onClick}
      className={`w-full flex items-center justify-between p-3 rounded-xl mb-2 transition-all transform hover:scale-[1.02] active:scale-95 border ${colorClass}`}
    >
      <div className="flex items-center gap-3">
        <Icon size={18} />
        <span className="font-medium text-sm">{label}</span>
      </div>
      <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-white/20">
        {count} ТМЦ
      </span>
    </button>
  );

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {/* Развернутое окно */}
      {isOpen && (
        <div className={`mb-4 w-72 p-4 rounded-2xl shadow-2xl border animate-in slide-in-from-bottom-5 duration-300 ${
          isDarkMode ? 'bg-[#1e293b] border-slate-700 text-white' : 'bg-white border-gray-200 text-slate-800'
        }`}>
          <div className="flex justify-between items-center mb-4 px-1">
            <h3 className="font-bold flex items-center gap-2">
              <Bell size={16} className="text-blue-500" /> Уведомления
            </h3>
            <button onClick={() => setIsOpen(false)} className="text-gray-500 hover:text-gray-400">
              <ChevronDown size={20} />
            </button>
          </div>

          <ActionButton 
            icon={PackageCheck} 
            label="Подтвердить ТМЦ"
            count={stats.to_receive} 
            colorClass="bg-amber-500 text-white border-amber-600 shadow-amber-500/20 shadow-lg"
            onClick={() => console.log("#логика клика по принять")}
          />
          <ActionButton 
            icon={Wrench} 
            label="Подтвердить ремонт" 
            count={stats.to_repair} 
            colorClass="bg-amber-600 text-white border-amber-700 shadow-amber-500/20 shadow-lg"
            onClick={() => console.log("#логика клика по подтвердить ремонт")}
          />
          <ActionButton 
            icon={Send} 
            label="Выдано в работу" 
            count={stats.issued} 
            colorClass="bg-sky-500 text-white border-sky-600 shadow-sky-500/20 shadow-lg"
            onClick={() => console.log("#логика клика по выдано")}
          />
        </div>
      )}

      {/* Свернутая кнопка (Бэйдж) */}
      {!isOpen && (
        <button 
          onClick={() => setIsOpen(true)}
          className={`flex items-center gap-3 p-3 px-5 rounded-full shadow-xl transition-all hover:pr-6 border ${
            isDarkMode ? 'bg-[#1e293b] border-slate-700 text-white' : 'bg-white border-gray-100 text-slate-800'
          }`}
        >
          <span className="font-bold text-sm">Уведомления</span>
          <div className="flex gap-1">
            <span className="w-5 h-5 flex items-center justify-center bg-amber-500 text-[10px] text-white rounded-full font-bold shadow-md">{stats.to_receive}</span>
            <span className="w-5 h-5 flex items-center justify-center bg-amber-500 text-[10px] text-white rounded-full font-bold shadow-md">{stats.to_repair}</span>
            <span className="w-5 h-5 flex items-center justify-center bg-sky-500 text-[10px] text-white rounded-full font-bold shadow-md">{stats.issued}</span>
          </div>
          <ChevronUp size={18} className="text-gray-500" />
        </button>
      )}
    </div>
  );
};

export default QuickActions;