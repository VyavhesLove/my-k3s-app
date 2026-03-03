import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Hourglass, Home } from 'lucide-react';

export const TooManyRequestsPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-6 text-slate-200 font-sans">
      <div className="max-w-md w-full text-center bg-[#1e293b] border border-slate-800 rounded-2xl shadow-2xl p-8 space-y-6">
        
        {/* Иконка ожидания */}
        <div className="flex justify-center">
          <div className="p-4 bg-amber-500/10 rounded-full animate-pulse">
            <Hourglass size={64} className="text-amber-500" /> 
          </div>
        </div>
        
        {/* Код ошибки и сообщение */}
        <h1 className="text-8xl font-black text-slate-700 opacity-60">429</h1>
        <div className="space-y-2">
          <h2 className="text-3xl font-bold text-white">Слишком много попыток</h2>
          <p className="text-slate-400">
            Вы ввели пароль неверно 3 раза. В целях безопасности доступ временно ограничен. 
            <span className="block mt-2 font-semibold text-amber-400/80">Пожалуйста, возвращайтесь через 5 минут.</span>
          </p>
        </div>

        {/* Кнопка на главную */}
        <button 
          onClick={() => navigate('/')}
          className="inline-flex items-center gap-2 px-7 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold transition-all shadow-lg shadow-blue-900/20"
        >
          <Home size={20} /> Вернуться на главную
        </button>
      </div>
    </div>
  );
};

