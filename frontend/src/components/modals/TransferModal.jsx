import React, { useState, useEffect, useCallback } from 'react';
import { X, Send, MapPin, User as UserIcon, Lock } from 'lucide-react';
import api from '@/api/axios';
import { toast } from 'sonner';
import { useItemStore } from '@/store/useItemStore';

export const TransferModal = ({ isOpen, onClose, item, isDarkMode }) => {
  const { selectedItem, setSelectedItem, lockItem, unlockItem, refreshItems, lockedItems } = useItemStore();

  const [locations, setLocations] = useState([]);
  const [locationWarning, setLocationWarning] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isLocked, setIsLocked] = useState(false);
  const [formData, setFormData] = useState({
    targetLocation: '',
    responsible: '',
  });

  // ✅ useCallback для стабильной ссылки
  const fetchLocations = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get('/items/locations/');
      // Бэкенд возвращает { success: true, data: { locations: [...] } }
      const locationsData = response.data.data?.locations || response.data.locations || [];
      setLocations(locationsData);
      if (!locationsData || locationsData.length === 0) {
        setLocationWarning(true);
      } else {
        setLocationWarning(false);
      }
    } catch (err) {
      toast.error('Не удалось загрузить список локаций');
    } finally {
      setLoading(false);
    }
  }, []);

  // При открытии модалки - пробуем заблокировать ТМЦ
  useEffect(() => {
    if (isOpen && item) {
      const doLock = async () => {
        try {
          await lockItem(item.id);
          setIsLocked(true);
        } catch (err) {
          if (err.response?.status === 423) {
            setIsLocked(false);
            toast.error(`🔒 ${err.response.data.locked_by}`, {
              description: 'Этот ТМЦ уже редактируется другим пользователем'
            });
          } else {
            toast.error('Ошибка блокировки');
          }
        }
      };
      doLock();
      fetchLocations();
      setFormData(prev => ({ 
        ...prev, 
        responsible: item.responsible || '' 
      }));
    } else {
      // Сбрасываем состояние при закрытии
      setFormData({ targetLocation: '', responsible: '' });
      setLocations([]);
      setLocationWarning(false);
      setIsLocked(false);
    }
  }, [isOpen, item, fetchLocations, lockItem]);

  // При закрытии - разблокируем
  const handleClose = async () => {
    if (isLocked && item) {
      try {
        await unlockItem(item.id);
      } catch (err) {
        console.error('Ошибка разблокировки:', err);
      }
    }
    setFormData({ targetLocation: '', responsible: '' });
    setIsLocked(false);
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!item || !isLocked) {
      toast.error('Невозможно выполнить операцию', {
        description: 'ТМЦ заблокирован другим пользователем'
      });
      return;
    }

    toast.promise(
      api.put(`/items/${item.id}/`, {
        location: formData.targetLocation,
        responsible: formData.responsible,
        status: 'confirm'
      }),
      {
        loading: 'Передача ТМЦ на подтверждение...',
        success: async () => {
          // Разблокируем перед закрытием
          await unlockItem(item.id);
          setIsLocked(false);
          
          // ✅ Обновляем список через Zustand
          refreshItems();
          setSelectedItem(null);
          
          handleClose();
          return `ТМЦ "${item.name}" передано на подтверждение`;
        },
        error: 'Ошибка при передаче. Попробуйте еще раз.',
      }
    );
  };

  // ✅ Рендерим только если isOpen и item существуют
  if (!isOpen || !item) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div 
        className={`w-full max-w-2xl rounded-2xl shadow-2xl transform transition-all ${
          isDarkMode ? 'bg-slate-900 text-white border border-slate-700' : 'bg-white text-slate-900'
        }`}
      >
        {/* Шапка */}
        <div className="flex justify-between items-center p-6 border-b border-gray-500/10">
          <h2 className="text-xl font-bold uppercase tracking-tight flex items-center gap-2">
            Передать ТМЦ
            {isLocked && (
              <span className="text-xs text-green-500 font-normal flex items-center gap-1">
                <Lock size={14} /> Заблокировано
              </span>
            )}
          </h2>
          <button 
            onClick={handleClose}
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
                  <td className="px-4 py-4 text-sm font-mono">{item.id}</td>
                  <td className="px-4 py-4 text-sm font-medium">{item.name}</td>
                  <td className="px-4 py-4 text-sm text-gray-500">{item.location || 'Не указана'}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Предупреждение о блокировке */}
          {!isLocked && (
            <div className="mb-6 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center gap-2">
              <Lock className="text-amber-500" size={18} />
              <span className="text-amber-600 dark:text-amber-400 text-sm">
                Этот ТМЦ заблокирован другим пользователем
              </span>
            </div>
          )}

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
                  disabled={loading || !isLocked}
                  className={`w-full h-11 pl-10 pr-4 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 ${
                    isDarkMode 
                      ? 'bg-slate-800 border-slate-700' 
                      : 'bg-gray-50 border-gray-200'
                  } border ${!isLocked ? 'opacity-50 cursor-not-allowed' : ''}`}
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
                  disabled={!isLocked}
                  placeholder="ФИО сотрудника"
                  className={`w-full h-11 pl-10 pr-4 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 ${
                    isDarkMode 
                      ? 'bg-slate-800 border-slate-700' 
                      : 'bg-gray-50 border-gray-200'
                  } border ${!isLocked ? 'opacity-50 cursor-not-allowed' : ''}`}
                  value={formData.responsible}
                  onChange={(e) => setFormData({ ...formData, responsible: e.target.value })}
                />
              </div>
            </div>

            {/* Действия */}
            <div className="flex justify-end gap-3 mt-8">
              <button 
                type="button"
                onClick={handleClose}
                className={`px-6 py-2.5 rounded-xl font-semibold transition-colors ${
                  isDarkMode ? 'bg-slate-800 hover:bg-slate-700' : 'bg-gray-100 hover:bg-gray-200'
                }`}
              >
                Отмена
              </button>
              <button 
                type="submit"
                disabled={loading || !isLocked}
                className={`px-8 py-2.5 rounded-xl font-bold text-white shadow-lg transition-all flex items-center gap-2 ${
                  loading || !isLocked
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

