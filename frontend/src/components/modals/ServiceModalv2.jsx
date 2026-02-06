import React, { useState } from 'react';
import { X } from 'lucide-react';
import api from '../../api/axios';
import { toast } from 'sonner';

const ServiceModal = ({ isOpen, onClose, item, mode, isDarkMode }) => {
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  const isSend = mode === 'send';
  const title = isSend ? 'Отправить в сервис' : 'Вернуть из сервиса';
  const label = isSend ? 'Причина ремонта' : 'Комментарии';

  const handleSubmit = async () => {
    setLoading(true);
    try {
      // Отправляем частичное обновление на бэкенд
      // Статусы должны соответствовать твоей логике на бэкенде (например, 'in_service' и 'active')
      const newStatus = isSend ? 'in_service' : 'active';
      
      await api.patch(`/items/${item?.id}/`, {
        status: newStatus,
        service_comment: comment // Бэкенд должен уметь обрабатывать это поле для истории
      });

      toast.success(isSend ? "ТМЦ отправлено в сервис" : "ТМЦ возвращено из сервиса");
      onClose();
      // Тут желательно вызвать обновление списка (fetchItems), если есть такая возможность через пропсы
      window.location.reload(); 
    } catch (err) {
      toast.error("Ошибка при обновлении статуса");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className={`w-full max-w-2xl rounded-xl shadow-2xl ${isDarkMode ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}`}>
        <div className="flex justify-between items-center p-6 border-b border-gray-500/20">
          <h2 className="text-xl font-bold">{title}</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-500/10 rounded-full"><X size={24} /></button>
        </div>
        
        <div className="p-6">
          <table className="w-full mb-6">
            <thead>
              <tr className="text-left text-sm font-bold border-b border-gray-500/20">
                <th className="pb-2 w-16">Ид.</th>
                <th className="pb-2">Наименование</th>
                <th className="pb-2">{label}</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="py-4 text-sm">{item?.id}</td>
                <td className="py-4 text-sm pr-4">{item?.name}</td>
                <td className="py-4">
                  <textarea 
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    className={`w-full p-2 rounded-lg border focus:ring-2 outline-none transition-all ${
                      isDarkMode ? 'bg-slate-800 border-slate-700 focus:ring-blue-500' : 'bg-gray-50 border-gray-300 focus:ring-blue-400'
                    }`}
                    rows="3"
                    placeholder={isSend ? "Опишите неисправность..." : "Результат ремонта..."}
                  />
                </td>
              </tr>
            </tbody>
          </table>

          <div className="flex justify-end gap-3 mt-4">
            <button 
              onClick={onClose}
              className="px-6 py-2 rounded-lg font-medium bg-gray-500/20 hover:bg-gray-500/30 transition-colors"
            >
              Отмена
            </button>
            <button 
              onClick={handleSubmit}
              disabled={loading || (isSend && !comment.trim())}
              className={`px-6 py-2 rounded-lg font-medium text-white transition-all ${
                loading ? 'opacity-50 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 shadow-lg'
              }`}
            >
              {loading ? 'Обработка...' : isSend ? 'Отправить' : 'Вернуть'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServiceModal;