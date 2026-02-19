import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Ghost, Home } from 'lucide-react';

const NotFoundPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-6 text-slate-200 font-sans">
      <div className="max-w-md w-full text-center bg-[#1e293b] border border-slate-800 rounded-2xl shadow-2xl p-8 space-y-6">
        
        {/* Иконка-призрак */}
        <div className="flex justify-center">
<div className="p-4 bg-purple-500/10 rounded-full animate-bounce">
            <Ghost size={64} className="text-purple-400" />
          </div>
        </div>
        
        {/* Код ошибки и сообщение */}
        <h1 className="text-8xl font-black text-slate-700 opacity-60">404</h1>
        <div className="space-y-2">
          <h2 className="text-3xl font-bold text-white">Страница не найдена</h2>
          <p className="text-slate-400">
            Ой! Похоже, мы не смогли найти страницу, которую вы ищете. Возможно, она была перемещена или удалена.
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

export default NotFoundPage;