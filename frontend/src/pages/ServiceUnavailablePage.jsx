import React from 'react';
import { RefreshCw, Wrench } from 'lucide-react';

const ServiceUnavailablePage = () => {
  return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-6 text-slate-200 font-sans">
      <div className="max-w-md w-full text-center bg-[#1e293b] border border-slate-800 rounded-2xl shadow-2xl p-8 space-y-6">
        
        {/* Анимированная иконка - ключ закручивает гайку */}
        <div className="relative h-32 flex items-center justify-center">
          <Wrench 
            size={100} 
            className="text-yellow-500"
            style={{ 
              animation: 'wrench-tighten 1s ease-in-out infinite alternate',
            }}
          />
        </div>
        
        {/* Код ошибки */}
        <h1 className="text-8xl font-black text-slate-700 opacity-60">503</h1>
        
        {/* Заголовок и описание */}
        <div className="space-y-2">
          <h2 className="text-3xl font-bold text-white">Сервис временно недоступен</h2>
          <p className="text-slate-400">
            Мы проводим техническое обслуживание или у нас возникли временные неполадки. Пожалуйста, попробуйте обновить страницу через несколько минут.
          </p>
        </div>

        {/* Кнопка обновления */}
        <button 
          onClick={() => window.location.reload()}
          className="inline-flex items-center gap-2 px-7 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold transition-all shadow-lg shadow-blue-900/20"
        >
          <RefreshCw size={20} className="animate-spin" style={{ animationDuration: '2s' }} /> 
          Обновить страницу
        </button>
        
      </div>
    </div>
  );
};

export default ServiceUnavailablePage;

