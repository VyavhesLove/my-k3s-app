import React, { useState, useEffect, useCallback } from 'react';
import { X, Users, PlusCircle } from 'lucide-react';
import BrigadeModal from './BrigadeModal';
import api from '../../api/axios';
import { toast } from 'sonner';
import { useItemStore } from '../../store/useItemStore';

// ✅ Props-based подход вместо прямого доступа к store
const AtWorkModal = ({ isOpen, onClose, selectedItem, isDarkMode }) => {
  // ✅ Локальное состояние
  const [brigades, setBrigades] = useState([]);
  const [selectedBrigade, setSelectedBrigade] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isBrigadeModalOpen, setIsBrigadeModalOpen] = useState(false);

  // ✅ Загрузка бригад только при открытии
  useEffect(() => {
    if (isOpen && selectedItem) {
      const fetchBrigades = async () => {
        try {
          const response = await api.get('/brigades/');
          setBrigades(response.data.brigades || []);
        } catch (err) {
          console.error('Ошибка загрузки бригад:', err);
          toast.error('Не удалось загрузить список бригад');
        }
      };
      fetchBrigades();
      setSelectedBrigade(''); // Сброс выбора
    }
  }, [isOpen, selectedItem]);

  // ✅ useCallback для мемоизации
  const handleSaveBrigade = useCallback(async (newBrigade) => {
    try {
      const response = await api.post('/brigades/', newBrigade);
      setBrigades(prev => [...prev, response.data]);
      toast.success("Бригада создана");
    } catch (err) {
      console.error('Ошибка сохранения бригады:', err);
      toast.error("Ошибка при создании бригады");
    }
  }, []);

  const handleIssueItem = useCallback(async () => {
    if (!selectedBrigade) {
      toast.error("Сначала выберите бригаду!");
      return;
    }

    if (!selectedItem) {
      toast.error("ТМЦ не выбрано");
      return;
    }

    setIsSubmitting(true);
    try {
      await api.put(`items/${selectedItem.id}/`, {
        status: 'at_work',
        brigade: selectedBrigade
      });

      toast.success("ТМЦ успешно передано в работу", {
        description: `Закреплено за бригадой ID: ${selectedBrigade}`,
      });
      
      // ✅ Обновляем список через Zustand
      const { refreshItems, setSelectedItem } = useItemStore.getState();
      await refreshItems();
      setSelectedItem(null);
      
      onClose();
      setSelectedBrigade('');
    } catch (error) {
      toast.error("Ошибка при передаче");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  }, [selectedBrigade, selectedItem, onClose]);

  // ✅ Early return после всех хуков (это нормально в React)
  if (!isOpen || !selectedItem) {
    return null;
  }

  return (
    <>
      {/* Оверлей модального окна */}
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <div 
          className={`w-full max-w-lg rounded-2xl shadow-2xl transform transition-all ${
            isDarkMode ? 'bg-slate-900 text-white border border-slate-700' : 'bg-white text-slate-900'
          }`}
        >
          {/* Шапка */}
          <div className="flex justify-between items-center p-6 border-b border-gray-500/10">
            <h2 className="text-xl font-bold uppercase tracking-tight">Выдача ТМЦ в работу</h2>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-gray-500/10 rounded-full transition-colors"
            >
              <X size={24} />
            </button>
          </div>

          {/* Контент */}
          <div className="p-6">
            {/* Информация о выбранном ТМЦ */}
            {selectedItem && (
              <div className={`overflow-hidden rounded-xl border border-gray-500/10 mb-6 ${
                isDarkMode ? 'bg-slate-800/50' : 'bg-gray-50'
              }`}>
                <table className="w-full text-left">
                  <thead className={isDarkMode ? 'bg-slate-800' : 'bg-gray-100'}>
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
            )}

            {/* Выбор бригады */}
            <div className="space-y-4">
              <label className="block text-sm font-medium uppercase tracking-wider text-gray-500">
                Выберите бригаду
              </label>
              
              <div className="flex gap-4 items-center">
                <div className="relative flex-1">
                  <Users className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <select 
                    value={selectedBrigade}
                    onChange={(e) => setSelectedBrigade(e.target.value)}
                    className={`w-full pl-10 pr-4 py-3 rounded-xl border outline-none appearance-none focus:ring-2 focus:ring-blue-500 ${
                      isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-gray-50 border-gray-300'
                    }`}
                  >
                    <option value="">-- Не выбрана --</option>
                    {brigades.map(b => (
                      <option key={b.id} value={b.id}>
                        {b.name} ({b.brigadier})
                      </option>
                    ))}
                  </select>
                </div>

                <button 
                  onClick={() => setIsBrigadeModalOpen(true)}
                  className="flex items-center gap-2 px-4 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl transition-all font-medium"
                >
                  <PlusCircle size={20} />
                  <span>Создать</span>
                </button>
              </div>

              {/* Кнопка передачи */}
              <button 
                onClick={handleIssueItem}
                disabled={isSubmitting}
                className="mt-4 w-full py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all disabled:opacity-50 active:scale-[0.98]"
              >
                {isSubmitting ? "Передача..." : "Передать в работу"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Модалка создания бригады */}
      <BrigadeModal 
        isOpen={isBrigadeModalOpen} 
        onClose={() => setIsBrigadeModalOpen(false)} 
        onSave={handleSaveBrigade}
        isDarkMode={isDarkMode}
      />
    </>
  );
};

export default AtWorkModal;

