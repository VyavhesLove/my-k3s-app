import React, { useState, useEffect, useCallback } from 'react';
import { X, Users, PlusCircle, Lock } from 'lucide-react';
import { BrigadeModal } from './BrigadeModal';
import api from '@/api/axios';
import { toast } from 'sonner';
import { useItemStore } from '@/store/useItemStore';

// ✅ Props-based подход вместо прямого доступа к store
export const AtWorkModal = ({ isOpen, onClose, selectedItem, isDarkMode }) => {
  // ✅ Локальное состояние
  const { lockItem, unlockItem, refreshItems, setSelectedItem, lockedItems } = useItemStore();
  
  const [brigades, setBrigades] = useState([]);
  const [selectedBrigade, setSelectedBrigade] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isBrigadeModalOpen, setIsBrigadeModalOpen] = useState(false);
  const [isLocked, setIsLocked] = useState(false);

  // ✅ Загрузка бригад и попытка блокировки только при открытии
  useEffect(() => {
    if (isOpen && selectedItem) {
      // Проверяем, что ТМЦ в статусе "issued" (выдано)
      if (selectedItem.status !== 'issued') {
        toast.error("ТМЦ можно передать в работу только из статуса 'Выдано'");
        onClose();
        return;
      }

      const doLock = async () => {
        try {
          await lockItem(selectedItem.id);
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
      
      const fetchBrigades = async () => {
        try {
          const response = await api.get('/brigades/');
          // Бэкенд возвращает { success: true, data: { brigades: [...] } }
          const brigadesData = response.data.data?.brigades || response.data.brigades || [];
          setBrigades(brigadesData);
        } catch (err) {
          console.error('Ошибка загрузки бригад:', err);
          toast.error('Не удалось загрузить список бригад');
        }
      };
      
      doLock();
      fetchBrigades();
      setSelectedBrigade(''); // Сброс выбора
    }
  }, [isOpen, selectedItem, lockItem]);

  // При закрытии - разблокируем
  const handleClose = async () => {
    if (isLocked && selectedItem) {
      try {
        await unlockItem(selectedItem.id);
      } catch (err) {
        console.error('Ошибка разблокировки:', err);
      }
    }
    setSelectedBrigade('');
    setIsLocked(false);
    onClose();
  };

  // ✅ useCallback для мемоизации
  const handleSaveBrigade = useCallback(async (newBrigade) => {
    try {
      const response = await api.post('/brigades/', newBrigade);
      // Бэкенд возвращает { success: true, data: {...} }
      const newBrigadeData = response.data.data || response.data;
      setBrigades(prev => [...prev, newBrigadeData]);
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

    if (!selectedItem || !isLocked) {
      toast.error('Невозможно выполнить операцию', {
        description: 'ТМЦ заблокирован другим пользователем'
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await api.put(`items/${selectedItem.id}/`, {
        status: 'at_work',
        brigade: selectedBrigade
      });

      // Разблокируем перед закрытием
      await unlockItem(selectedItem.id);
      setIsLocked(false);

      toast.success("ТМЦ успешно передано в работу", {
        description: `Закреплено за бригадой ID: ${selectedBrigade}`,
      });
      
      // ✅ Обновляем список через Zustand
      await refreshItems();
      setSelectedItem(null);
      
      handleClose();
    } catch (error) {
      toast.error("Ошибка при передаче");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  }, [selectedBrigade, selectedItem, isLocked, refreshItems, setSelectedItem, unlockItem]);

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
            <h2 className="text-xl font-bold uppercase tracking-tight flex items-center gap-2">
              Выдача ТМЦ в работу
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
            {/* Предупреждение о блокировке */}
            {!isLocked && (
              <div className="mb-6 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center gap-2">
                <Lock className="text-amber-500" size={18} />
                <span className="text-amber-600 dark:text-amber-400 text-sm">
                  Этот ТМЦ заблокирован другим пользователем
                </span>
              </div>
            )}

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
                    disabled={!isLocked}
                    onChange={(e) => setSelectedBrigade(e.target.value)}
                    className={`w-full pl-10 pr-4 py-3 rounded-xl border outline-none appearance-none focus:ring-2 focus:ring-blue-500 ${
                      isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-gray-50 border-gray-300'
                    } ${!isLocked ? 'opacity-50 cursor-not-allowed' : ''}`}
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
                  disabled={!isLocked}
                  className={`flex items-center gap-2 px-4 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl transition-all font-medium ${!isLocked ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <PlusCircle size={20} />
                  <span>Создать</span>
                </button>
              </div>

              {/* Кнопка передачи */}
              <button 
                onClick={handleIssueItem}
                disabled={isSubmitting || !isLocked}
                className={`mt-4 w-full py-3 text-white rounded-xl font-bold transition-all active:scale-[0.98] ${
                  isSubmitting || !isLocked
                    ? 'bg-blue-600/50 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
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

