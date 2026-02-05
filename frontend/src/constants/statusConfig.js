// src/constants/statusConfig.js

export const statusMap = {
  at_work: 'В работе',
  in_repair: 'В ремонте',
  issued: 'Выдано',
  available: 'Доступно',
  confirm: 'Подтвердить ТМЦ',
  confirm_repair: 'Подтвердить ремонт',
  retired: 'Списано'
};

export const getStatusStyles = (status, isDarkMode) => {
  const styles = {
    at_work: isDarkMode 
      ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30' 
      : 'bg-sky-100 text-sky-700 border border-sky-200',
    
    issued: isDarkMode 
      ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30' 
      : 'bg-sky-100 text-sky-700 border border-sky-200',

    available: isDarkMode 
      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
      : 'bg-emerald-100 text-emerald-700 border border-emerald-200',

    in_repair: isDarkMode 
      ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' 
      : 'bg-rose-100 text-rose-700 border border-rose-200',

    confirm: isDarkMode 
      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' 
      : 'bg-amber-100 text-amber-700 border border-amber-200',

    confirm_repair: isDarkMode 
      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' 
      : 'bg-amber-100 text-amber-700 border border-amber-200',

    retired: isDarkMode 
      ? 'bg-slate-500/20 text-slate-400 border border-slate-500/30' 
      : 'bg-gray-100 text-gray-600 border border-gray-200',
  };

  return styles[status] || (isDarkMode ? 'bg-slate-800 text-slate-400' : 'bg-gray-100 text-gray-500');
};