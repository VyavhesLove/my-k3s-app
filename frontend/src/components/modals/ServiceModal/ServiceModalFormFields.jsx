// components/modals/ServiceModal/ServiceModalFormFields.jsx
export const ServiceModalFormFields = ({ 
  isSend, 
  isConfirm, 
  isReturn, 
  status,
  isDarkMode, 
  register, 
  errors 
}) => {
  // Для статуса confirm (простое подтверждение ТМЦ)
  if (isConfirm && status === 'confirm') {
    return (
      <div className="space-y-2">
        <label className="text-xs font-bold uppercase text-gray-500 ml-1">Комментарий</label>
        <textarea 
          {...register('comment')}
          className={`w-full p-4 rounded-xl border outline-none transition-all resize-none ${
            isDarkMode 
              ? 'bg-slate-800 border-slate-700 focus:border-amber-500 focus:ring-1 focus:ring-amber-500' 
              : 'bg-gray-50 border-gray-200 focus:border-amber-400 focus:ring-1 focus:ring-amber-400'
          } ${errors.comment ? 'border-red-500' : ''}`}
          rows="3"
          placeholder="Комментарий к подтверждению (необязательно)"
        />
        {errors.comment && (
          <p className="text-red-500 text-sm mt-1">{errors.comment.message}</p>
        )}
      </div>
    );
  }

  // Для send и return
  if (isSend || isReturn) {
    return (
      <div className="space-y-2">
        <label className="text-xs font-bold uppercase text-gray-500 ml-1">
          {isSend ? 'Причина ремонта' : 'Комментарии'}
        </label>
        <textarea 
          {...register('comment')}
          className={`w-full p-4 rounded-xl border outline-none transition-all resize-none ${
            isDarkMode 
              ? 'bg-slate-800 border-slate-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500' 
              : 'bg-gray-50 border-gray-200 focus:border-blue-400 focus:ring-1 focus:ring-blue-400'
          } ${errors.comment ? 'border-red-500' : ''}`}
          rows="4"
          placeholder={isSend ? "Опишите неисправность..." : "Результат обслуживания..."}
        />
        {errors.comment && (
          <p className="text-red-500 text-sm mt-1">{errors.comment.message}</p>
        )}
      </div>
    );
  }

  return null;
};

