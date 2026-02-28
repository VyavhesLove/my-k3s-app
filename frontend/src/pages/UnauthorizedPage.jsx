import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, LogIn } from 'lucide-react';

export const UnauthorizedPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-6 text-slate-200 font-sans">
      <div className="max-w-md w-full text-center bg-[#1e293b] border border-slate-800 rounded-2xl shadow-2xl p-8 space-y-6">
        <div className="flex justify-center">
          <div className="p-4 bg-amber-500/10 rounded-full">
            <ShieldAlert size={64} className="text-amber-400" />
          </div>
        </div>

        <h1 className="text-8xl font-black text-slate-700 opacity-60">401</h1>

        <div className="space-y-2">
          <h2 className="text-3xl font-bold text-white">Требуется авторизация</h2>
          <p className="text-slate-400">
            Ваша сессия истекла или доступ к ресурсу недоступен без входа.
            Пожалуйста, авторизуйтесь снова.
          </p>
        </div>

        <button
          onClick={() => navigate('/login')}
          className="inline-flex items-center gap-2 px-7 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold transition-all shadow-lg shadow-blue-900/20"
        >
          <LogIn size={20} /> Перейти к входу
        </button>
      </div>
    </div>
  );
};
