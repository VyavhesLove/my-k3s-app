import React, { useState, useEffect } from 'react';
import { X, RotateCcw, AlertTriangle, Lock } from 'lucide-react';
import api from '@/api/axios';
import { toast } from 'sonner';
import { useItemStore } from '@/store/useItemStore';

const BulkRestoreModal = ({ 
  isOpen, 
  onClose, 
  selectedItems = [], 
  onSuccess,
  isDarkMode = false 
}) => {
  const { lockItem, unlockItem } = useItemStore();
  const [loading, setLoading] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [lockedItems, setLockedItems] = useState({});

  // Блокировка ТМЦ при открытии
  useEffect(() => {
    if (isOpen && selectedItems.length > 0) {
      const doLock = async () => {
        const lockedResults = {};
        let allLocked = true;
        
        for (const item of selectedItems) {
          try {
            await lockItem(item.id);
            lockedResults[item.id] = true;
          } catch (err) {
            if (err.response?.status === 423) {
              lockedResults[item.id] = false;
              toast.error(`🔒 ТМЦ ID ${item.id} заблокирован пользователем ${err.response.data.locked_by}`);
            } else {
              lockedResults[item.id] = false;
            }
            allLocked = false;
          }
        }
        
        setLockedItems(lockedResults);
        setIsLocked(allLocked);
      };
      doLock();
    } else {
      // Сброс состояния при закрытии
      setIsLocked(false);
      setLockedItems({});
    }
  }, [isOpen, selectedItems, lockItem]);

  // Разблокировка при закрытии
  const handleClose = async () => {
    for (const item of selectedItems) {
      if (lockedItems[item.id]) {
        try {
          await unlockItem(item.id);
        } catch (err) {
          console.error('Ошибка разблокировки:', err);
        }
      }
    }
    setIsLocked(false);
    setLockedItems({});
    onClose();
  };

  if (!isOpen) return null;

  const handleRestore = async () => {
    if (!isLocked) {
      toast.error('Невозможно выполнить операцию. Некоторые ТМЦ заблокированы другими пользователями.');
      return;
    }
    
    setLoading(true);
    try {
      const response = await api.post('/writeoffs/bulk-restore/', {
        ids: selectedItems.map(item => item.id)
      });

      toast.success(response.data.message || 'ТМЦ успешно восстановлены');
      onSuccess?.();
      handleClose();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Ошибка при восстановлении ТМЦ');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div
        className={`w-full max-w-md rounded-2xl shadow-2xl transform transition-all ${
          isDarkMode ? 'bg-slate-900 text-white border border-slate-700' : 'bg-white text-slate-900'
        }`}
      >
        {/* Шапка */}
        <div className="flex justify-between items-center p-6 border-b border-gray-500/10">
          <h2 className="text-xl font-bold uppercase tracking-tight flex items-center gap-2">
            <RotateCcw size={24} className="text-emerald-500" />
            Восстановление ТМЦ
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
          {!isLocked && selectedItems.length > 0 && (
            <div className="mb-4 p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-3">
              <Lock className="text-red-500 flex-shrink-0 mt-0.5" size={20} />
              <div className="text-red-600 dark:text-red-400 text-sm">
                Некоторые ТМЦ заблокированы другими пользователями. Операция будет недоступна.
              </div>
            </div>
          )}

          {/* Предупреждение */}
          <div className="mb-6 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-3">
            <AlertTriangle className="text-amber-500 flex-shrink-0 mt-0.5" size={20} />
            <div className="text-amber-600 dark:text-amber-400 text-sm">
              Вы собираетесь восстановить {selectedItems.length} ТМЦ из списания. 
              ТМЦ будут возвращены в статус "Доступно".
            </div>
          </div>

          {/* Список выбранных ТМЦ */}
          {selectedItems.length > 0 && (
            <div className={`overflow-hidden rounded-xl border border-gray-500/10 mb-6 max-h-48 overflow-y-auto ${
              isDarkMode ? 'bg-slate-800/50' : 'bg-gray-50'
            }`}>
              <table className="w-full text-left">
                <thead className={`sticky top-0 ${isDarkMode ? 'bg-slate-800' : 'bg-gray-100'}`}>
                  <tr className="text-xs font-bold uppercase text-gray-500">
                    <th className="px-4 py-2 w-16">Ид.</th>
                    <th className="px-4 py-2">Наименование</th>
                    <th className="px-4 py-2">Серийный</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-500/10">
                  {selectedItems.map((item) => (
                    <tr key={item.id}>
                      <td className="px-4 py-2 text-sm font-mono">{item.id}</td>
                      <td className="px-4 py-2 text-sm font-medium">{item.name || '-'}</td>
                      <td className="px-4 py-2 text-sm">{item.serial || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Кнопки */}
          <div className="flex gap-3">
            <button
              onClick={handleClose}
              disabled={loading}
              className={`flex-1 py-3 rounded-xl font-semibold transition-colors ${
                isDarkMode
                  ? 'bg-slate-800 hover:bg-slate-700'
                  : 'bg-gray-100 hover:bg-gray-200'
              }`}
            >
              Отмена
            </button>
            <button
              onClick={handleRestore}
              disabled={loading || !isLocked}
              className={`flex-1 py-3 rounded-xl font-bold text-white shadow-lg transition-all flex items-center justify-center gap-2 ${
                loading || !isLocked
                  ? 'bg-emerald-600/50 cursor-not-allowed'
                  : 'bg-emerald-600 hover:bg-emerald-500 active:scale-95 shadow-emerald-900/20'
              }`}
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Восстановление...
                </>
              ) : (
                <>
                  <RotateCcw size={18} />
                  Восстановить
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BulkRestoreModal;

