import React, { useState } from 'react';
import { X } from 'lucide-react';
import api from '../../api/axios';
import { toast } from 'sonner';
import { useItemStore } from '../../store/useItemStore';

const ServiceModal = ({ isDarkMode }) => {
  const { 
    selectedItem, 
    serviceMode, 
    isServiceModalOpen, 
    closeServiceModal 
  } = useItemStore();

  const [comment, setComment] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [location, setLocation] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isServiceModalOpen || !selectedItem) return null;

  const isSend = serviceMode === 'send';
  const isConfirm = serviceMode === 'confirm';
  const isReturn = serviceMode === 'return';

  const title = isSend 
    ? 'Отправить в сервис' 
    : isConfirm 
      ? 'Подтвердить ремонт' 
      : 'Принять из ремонта';
  
  const buttonText = isSend 
    ? 'Отправить' 
    : isConfirm 
      ? 'Подтвердить' 
      : 'Принять';

  const handleSubmit = async () => {
    setLoading(true);
    try {
      if (isSend) {
        // Отправка в сервис - используем существующий эндпоинт
        await api.patch(`/items/${selectedItem.id}/`, {
          status: 'confirm_repair',
          service_comment: comment
        });
        toast.success("ТМЦ отправлено в сервис");
      } 
      else if (isConfirm) {
        // Подтверждение ремонта - новый эндпоинт
        if (!invoiceNumber.trim()) {
          return toast.error("Укажите номер счета");
        }
        if (!location.trim()) {
          return toast.error("Укажите локацию сервиса");
        }
        
        await api.post(`/items/${selectedItem.id}/confirm-repair/`, {
          invoice_number: invoiceNumber,
          location: location
        });
        toast.success("Ремонт согласован");
      } 
      else if (isReturn) {
        // Возврат из сервиса
        await api.post(`/items/${selectedItem.id}/return-from-service/`, {
          comment: comment
        });
        toast.success("ТМЦ принято из ремонта");
      }

      closeServiceModal();
      setComment('');
      setInvoiceNumber('');
      setLocation('');
      window.location.reload();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Ошибка при выполнении операции");
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

          {/* Поля для режима подтверждения ремонта */}
          {isConfirm && (
            <div className="space-y-4 mb-6 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-amber-600 ml-1">Номер счета</label>
                <input 
                  type="text"
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  className="input-theme w-full p-4 rounded-xl border outline-none transition-all focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                  placeholder="Введите номер счета"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-amber-600 ml-1">Локация сервиса</label>
                <input 
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="input-theme w-full p-4 rounded-xl border outline-none transition-all focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                  placeholder="Адрес/название сервиса"
                />
              </div>
            </div>
          )}

          {/* Комментарий - для send и return */}
          {(isSend || isReturn) && (
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-gray-500 ml-1">
                {isSend ? 'Причина ремонта' : 'Комментарии'}
              </label>
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
          )}

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
                  : isConfirm 
                    ? 'bg-amber-500 hover:bg-amber-400 active:scale-95 shadow-amber-900/20'
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
