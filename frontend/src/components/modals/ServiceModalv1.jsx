import React, { useState, useEffect } from 'react';
import { X, AlertCircle } from 'lucide-react';

const ServiceModal = ({ isOpen, onClose, onSubmit, item, mode, isDarkMode }) => {
  const [text, setText] = useState('');
  
  // Сбрасываем текст при открытии/закрытии
  useEffect(() => { if (!isOpen) setText(''); }, [isOpen]);

  if (!isOpen || !item) return null;

  const isReturn = mode === 'return';

  return (
    // Backdrop с accessibility (закрытие по клику на фон)
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      {/* Останавливаем всплытие клика, чтобы модалка не закрывалась при клике внутри неё */}
      <div 
        className={`w-full max-w-lg rounded-2xl shadow-2xl transition-all border ${
          isDarkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-gray-200 text-slate-900'
        }`}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-500/10">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${isReturn ? 'bg-emerald-500/20 text-emerald-500' : 'bg-sky-500/20 text-sky-500'}`}>
              <AlertCircle size={20} />
            </div>
            <h3 className="text-xl font-bold tracking-tight">
              {isReturn ? 'Возврат из сервиса' : 'Отправка в сервис'}
            </h3>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 hover:bg-gray-500/10 rounded-full transition-colors"
            aria-label="Закрыть"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div className={`p-4 rounded-xl space-y-1 ${isDarkMode ? 'bg-slate-800/50' : 'bg-gray-50'}`}>
            <div className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Предмет</div>
            <div className="font-medium text-sm">{item.name}</div>
            <div className="text-xs text-gray-400">SN: {item.serial || '—'}</div>
          </div>

          <div className="space-y-2">
            <label className="text-xs uppercase font-bold text-gray-500 tracking-wider ml-1">
              {isReturn ? 'Комментарий по итогам' : 'Укажите причину поломки'}
            </label>
            <textarea
              autoFocus
              className={`w-full rounded-xl border p-4 min-h-[120px] text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all ${
                isDarkMode 
                  ? 'bg-slate-950 border-slate-700 text-white placeholder-gray-600' 
                  : 'bg-white border-gray-200 text-slate-900 placeholder-gray-400'
              }`}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={isReturn ? "Опишите результат ремонта..." : "Что именно не работает?"}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-gray-500/10 bg-gray-50/50 dark:bg-slate-900/50 rounded-b-2xl">
          <button 
            onClick={onClose} 
            className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
              isDarkMode ? 'hover:bg-slate-800 text-gray-400' : 'hover:bg-gray-200 text-gray-600'
            }`}
          >
            Отмена
          </button>
          <button 
            onClick={() => onSubmit(item?.id, text)}
            disabled={!text.trim()}
            className={`px-8 py-2.5 rounded-xl text-sm font-bold text-white shadow-lg transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none ${
              isReturn ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/20' : 'bg-blue-600 hover:bg-blue-500 shadow-blue-600/20'
            }`}
          >
            {isReturn ? 'Подтвердить возврат' : 'Отправить в сервис'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ServiceModal;