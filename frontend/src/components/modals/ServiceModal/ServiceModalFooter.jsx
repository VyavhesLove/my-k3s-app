// components/modals/ServiceModal/ServiceModalFooter.jsx
export const ServiceModalFooter = ({ 
  isDarkMode, 
  loading, 
  isConfirm, 
  status,
  watchedRepairAction,
  buttonText,
  onCancel
}) => {
  // Определяем класс кнопки
  const getButtonClass = () => {
    const baseClass = 'px-8 py-2.5 rounded-xl font-bold text-white shadow-lg transition-all';
    
    if (loading) {
      return `${baseClass} bg-blue-600/50 cursor-not-allowed`;
    }
    
    if (isConfirm && status === 'confirm_repair' && watchedRepairAction === 'write_off') {
      return `${baseClass} bg-red-600 hover:bg-red-500 active:scale-95 shadow-red-900/20`;
    }
    
    if (isConfirm) {
      return `${baseClass} bg-amber-500 hover:bg-amber-400 active:scale-95 shadow-amber-900/20`;
    }
    
    return `${baseClass} bg-blue-600 hover:bg-blue-500 active:scale-95 shadow-blue-900/20`;
  };

  // Текст кнопки с учётом write_off
  const submitText = loading 
    ? 'Обработка...' 
    : isConfirm && status === 'confirm_repair' && watchedRepairAction === 'write_off'
      ? 'Списать'
      : buttonText;

  return (
    <div className="flex justify-end gap-3 mt-8">
      <button 
        type="button"
        onClick={onCancel}
        className={`px-6 py-2.5 rounded-xl font-semibold transition-colors ${
          isDarkMode ? 'bg-slate-800 hover:bg-slate-700' : 'bg-gray-100 hover:bg-gray-200'
        }`}
      >
        Отмена
      </button>
      <button 
        type="submit"
        disabled={loading}
        className={getButtonClass()}
      >
        {submitText}
      </button>
    </div>
  );
};

