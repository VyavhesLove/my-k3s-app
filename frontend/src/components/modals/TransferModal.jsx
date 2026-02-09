import React, { useState, useEffect } from 'react';
import { X, Send, MapPin, User as UserIcon } from 'lucide-react';
import api from '../../api/axios';
import { toast } from 'sonner';
import { useItemStore } from '../../store/useItemStore';

const TransferModal = ({ isDarkMode }) => {
  const { 
    selectedItem, 
    isTransferModalOpen, 
    closeTransferModal,
    setSelectedItem 
  } = useItemStore();

  const [locations, setLocations] = useState([]);
  const [locationWarning, setLocationWarning] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    targetLocation: '',
    responsible: '',
  });

  // Загружаем список локаций при открытии модалки
  useEffect(() => {
    if (isTransferModalOpen) {
      const fetchLocations = async () => {
        setLoading(true);
        try {
          const response = await api.get('/locations');
          setLocations(response.data.locations || []);
          if (!response.data.locations || response.data.locations.length === 0) {
            setLocationWarning(true);
          } else {
            setLocationWarning(false);
          }
        } catch (err) {
          toast.error('Не удалось загрузить список локаций');
        } finally {
          setLoading(false);
        }
      };
      fetchLocations();

      // Предзаполняем ответственного из выбранного ТМЦ
      if (selectedItem) {
        setFormData(prev => ({ ...prev, responsible: selectedItem.responsible || '' }));
      }
    }
  }, [isTransferModalOpen, selectedItem]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedItem) return;

    toast.promise(
      api.put(`/items/${selectedItem.id}/`, {
        location: formData.targetLocation,
        responsible: formData.responsible,
        status: 'issued'
      }),
      {
        loading: 'Обновление данных о местоположении...',
        success: () => {
          closeTransferModal();
          setFormData({ targetLocation: '', responsible: '' });
          setSelectedItem(null);
          window.location.reload();
          return `ТМЦ "${selectedItem.name}" успешно передано в "${formData.targetLocation}"`;
        },
        error: 'Ошибка при передаче. Попробуйте еще раз.',
      }
    );
  };

  if (!isTransferModalOpen || !selectedItem) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div 
        className={`w-full max-w-2xl rounded-2xl shadow-2xl transform transition-all ${
          isDarkMode ? 'bg-slate-900 text-white border border-slate-700' : 'bg-white text-slate-900'
        }`}
      >
        {/* Шапка */}
        <div className="flex justify-between items-center p-6 border-b border-gray-500/10">
          <h2 className="text-xl font-bold uppercase tracking-tight">Передать ТМЦ</h2>
          <button 
            onClick={closeTransferModal}
            className="p-2 hover:bg-gray-500/10 rounded-full transition-colors"
          >
            <X size={24} />
          </button>
        </div>
        
        {/* Контент */}
        <div className="p-6">
          {/* Информация о ТМЦ */}
          <div className="overflow-hidden rounded-xl border border-gray-500/10 mb-6">
            <table className="w-full text-left">
              <thead className={isDarkMode ? 'bg-slate-800/50' : 'bg-gray-50'}>
                <tr className="text-xs font-bold uppercase text-gray-500">
                  <th className="px-4 py-3 w-20">Ид.</th>
                  <th className="px-4 py-3">Наименование</th>
                  <th className="px-4 py-3">Текущая локация</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-500/10">
                <tr>
                  <td className="px-4 py-4 text-sm font-mono">{selectedItem.id}</td>
                  <td className="px-4 py-4 text-sm font-medium">{selectedItem.name}</td>
                  <td className="px-4 py-4 text-sm text-gray-500">{selectedItem.location || 'Не указана'}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Форма */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Выбор локации */}
            <div>
              <label className={`block text-xs font-bold uppercase mb-2 ${isDarkMode ? 'text-gray-400' : 'text-slate-600'}`}>
                Новая локация *
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 text-gray-500" size={18} />
                <select
                  required
                  disabled={loading}
                  className={`w-full h-11 pl-10 pr-4 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 ${
                    isDarkMode 
                      ? 'bg-slate-800 border-slate-700' 
                      : 'bg-gray-50 border-gray-200'
                  } border`}
                  value={formData.targetLocation}
                  onChange={(e) => setFormData({ ...formData, targetLocation: e.target.value })}
                >
                  <option value="">Выберите локацию...</option>
                  {locations.map(loc => (
                    <option key={loc.id} value={loc.name}>{loc.name}</option>
                  ))}
                </select>
              </div>
              {locationWarning && (
                <p className="mt-2 text-sm text-amber-500 flex items-center gap-1">
                  <span>⚠️</span> Список локаций пуст. Обратитесь к администратору.
                </p>
              )}
            </div>

            {/* Ответственный */}
            <div>
              <label className={`block text-xs font-bold uppercase mb-2 ${isDarkMode ? 'text-gray-400' : 'text-slate-600'}`}>
                Новый ответственный *
              </label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-3 text-gray-500" size={18} />
                <input
                  type="text"
                  required
                  placeholder="ФИО сотрудника"
                  className={`w-full h-11 pl-10 pr-4 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 ${
                    isDarkMode 
                      ? 'bg-slate-800 border-slate-700' 
                      : 'bg-gray-50 border-gray-200'
                  } border`}
                  value={formData.responsible}
                  onChange={(e) => setFormData({ ...formData, responsible: e.target.value })}
                />
              </div>
            </div>

            {/* Действия */}
            <div className="flex justify-end gap-3 mt-8">
              <button 
                type="button"
                onClick={closeTransferModal}
                className={`px-6 py-2.5 rounded-xl font-semibold transition-colors ${
                  isDarkMode ? 'bg-slate-800 hover:bg-slate-700' : 'bg-gray-100 hover:bg-gray-200'
                }`}
              >
                Отмена
              </button>
              <button 
                type="submit"
                disabled={loading}
                className={`px-8 py-2.5 rounded-xl font-bold text-white shadow-lg transition-all flex items-center gap-2 ${
                  loading 
                    ? 'bg-blue-600/50 cursor-not-allowed' 
                    : 'bg-blue-600 hover:bg-blue-500 active:scale-95 shadow-blue-900/20'
                }`}
              >
                <Send size={18} />
                {loading ? 'Загрузка...' : 'Подтвердить передачу'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default TransferModal;

