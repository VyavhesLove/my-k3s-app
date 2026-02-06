import React, { useState } from 'react';
import { X } from 'lucide-react';
import api from '../../api/axios'; // Убедись, что путь к axios верный
import { toast } from 'sonner';
import { useItemStore } from '../../store/useItemStore';

const ServiceModal = ({ isDarkMode }) => {
  // Достаем всё необходимое из Zustand
  const { 
    selectedItem, 
    serviceMode, 
    isServiceModalOpen, 
    closeServiceModal 
  } = useItemStore();

  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  // Если модалка закрыта или предмет не выбран — ничего не рендерим
  if (!isServiceModalOpen || !selectedItem) return null;

  const isSend = serviceMode === 'send';
  const title = isSend ? 'Отправить в сервис' : 'Вернуть из сервиса';
  const label = isSend ? 'Причина ремонта' : 'Комментарии';
  const buttonText = isSend ? 'Отправить' : 'Вернуть';

  const handleSubmit = async () => {
    if (isSend && !comment.trim()) {
      return toast.error("Пожалуйста, укажите причину ремонта");
    }

    setLoading(true);
    try {
      const newStatus = isSend ? 'in_service' : 'active';
      
      // Отправляем запрос на бэкенд
      await api.patch(`/items/${selectedItem.id}/`, {
        status: newStatus,
        service_comment: comment
      });

      toast.success(isSend ? "ТМЦ отправлено в сервис" : "ТМЦ возвращено из сервиса");
      
      // Закрываем модалку через Zustand
      closeServiceModal();
      
      // Очищаем локальное поле комментария
      setComment('');

      // Обновляем страницу для получения свежих данных (или вызови fetchItems, если пробросишь его)
      window.location.reload(); 
    } catch (err) {
      toast.error(err.response?.data?.detail || "Ошибка при обновлении статуса");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div 
        className={`w-full max-w-2xl rounded-2xl shadow-2xl transform transition-all ${
          isDarkMode ? 'bg-slate-900 text-white border border-slate-700' : 'bg-white text-slate-900'
        }`}
      >
        {/* Шапка */}
        <div className="flex justify-between items-center p-6 border-b border-gray-500/10">
          <h2 className="text-xl font-bold uppercase tracking-tight">{title}</h2>
          <button 
            onClick={closeServiceModal} 
            className="p-2 hover:bg-gray-500/10 rounded-full transition-colors"
          >
            <X size={24} />
          </button>
        </div>
        
        {/* Контент */}
        <div className="p-6">
          <div className="overflow-hidden rounded-xl border border-gray-500/10 mb-6">
            <table className="w-full text-left">
              <thead className={isDarkMode ? 'bg-slate-800/50' : 'bg-gray-50'}>
                <tr className="text-xs font-bold uppercase text-gray-500">
                  <th className="px-4 py-3 w-20">Ид.</th>
                  <th className="px-4 py-3">Наименование</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-500/10">
                <tr>
                  <td className="px-4 py-4 text-sm font-mono">{selectedItem.id}</td>
                  <td className="px-4 py-4 text-sm font-medium">{selectedItem.name}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase text-gray-500 ml-1">{label}</label>
            <textarea 
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className={`w-full p-4 rounded-xl border outline-none transition-all resize-none ${
                isDarkMode 
                  ? 'bg-slate-800 border-slate-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500' 
                  : 'bg-gray-50 border-gray-200 focus:border-blue-400 focus:ring-1 focus:ring-blue-400'
              }`}
              rows="4"
              placeholder={isSend ? "Опишите неисправность..." : "Результат обслуживания..."}
            />
          </div>

          {/* Действия */}
          <div className="flex justify-end gap-3 mt-8">
            <button 
              onClick={closeServiceModal}
              className={`px-6 py-2.5 rounded-xl font-semibold transition-colors ${
                isDarkMode ? 'bg-slate-800 hover:bg-slate-700' : 'bg-gray-100 hover:bg-gray-200'
              }`}
            >
              Отмена
            </button>
            <button 
              onClick={handleSubmit}
              disabled={loading}
              className={`px-8 py-2.5 rounded-xl font-bold text-white shadow-lg transition-all ${
                loading 
                  ? 'bg-blue-600/50 cursor-not-allowed' 
                  : 'bg-blue-600 hover:bg-blue-500 active:scale-95 shadow-blue-900/20'
              }`}
            >
              {loading ? 'Обработка...' : buttonText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServiceModal;