import React, { useState, useEffect } from 'react';
import { X, CheckCircle, XCircle, Lock, Unlock } from 'lucide-react';
import api from '@/api/axios';
import { toast } from 'sonner';
import { useItemStore } from '@/store/useItemStore';

const ConfirmTMCModal = ({ isDarkMode }) => {
  const {
    selectedItem,
    isConfirmTMCModalOpen,
    closeConfirmTMCModal,
    lockItem,
    unlockItem,
    refreshItems,
    setSelectedItem
  } = useItemStore();

  const [action, setAction] = useState('accept');
  const [loading, setLoading] = useState(false);
  const [isLocked, setIsLocked] = useState(false);

  // При открытии модалки - пробуем заблокировать ТМЦ
  useEffect(() => {
    if (isConfirmTMCModalOpen && selectedItem) {
      setAction('accept'); // Сброс на действие по умолчанию
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
      doLock();
    }
  }, [isConfirmTMCModalOpen, selectedItem, lockItem]);

  // При закрытии - разблокируем
  const handleClose = async () => {
    if (isLocked && selectedItem) {
      try {
        await unlockItem(selectedItem.id);
      } catch (err) {
        console.error('Ошибка разблокировки:', err);
      }
    }
    setIsLocked(false);
    closeConfirmTMCModal();
  };

  const handleSubmit = async () => {
    if (!isLocked) {
      toast.error('Невозможно выполнить операцию', {
        description: 'ТМЦ заблокирован другим пользователем'
      });
      return;
    }

    setLoading(true);
    try {
      await api.post(`/items/${selectedItem.id}/confirm-tmc/`, {
        action: action
      });

      toast.success(
        action === 'accept'
          ? 'ТМЦ принято'
          : 'ТМЦ отклонено и возвращено',
        {
          description: action === 'accept'
            ? 'Статус изменён на "Выдано"'
            : 'Восстановлено исходное состояние'
        }
      );

      // Обновляем список
      await refreshItems();
      setSelectedItem(null);

      // Закрываем модалку (handleClose сам разблокирует)
      handleClose();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Ошибка при выполнении операции");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!isConfirmTMCModalOpen || !selectedItem) return null;

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
            Подтверждение ТМЦ
            {isLocked ? (
              <span className="text-xs text-green-500 font-normal flex items-center gap-1">
                <Lock size={14} /> Заблокировано
              </span>
            ) : (
              <span className="text-xs text-red-500 font-normal flex items-center gap-1">
                <Unlock size={14} /> Не заблокировано
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
              <Unlock className="text-amber-500" size={18} />
              <span className="text-amber-600 dark:text-amber-400 text-sm">
                Этот ТМЦ не заблокирован. Возможно, его редактирует другой пользователь.
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

          {/* Выбор действия */}
          <div className="space-y-4">
            <label className="block text-sm font-medium uppercase tracking-wider text-gray-500">
              Выберите действие
            </label>

            <div className="grid grid-cols-2 gap-4">
              {/* Принять */}
              <button
                type="button"
                onClick={() => setAction('accept')}
                disabled={!isLocked}
                className={`relative p-6 rounded-xl border-2 transition-all ${
                  isLocked ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'
                } ${
                  action === 'accept'
                    ? 'border-green-500 bg-green-500/10'
                    : 'border-gray-500/20 hover:border-gray-500/40'
                }`}
              >
                <div className="flex flex-col items-center gap-2">
                  <CheckCircle
                    size={32}
                    className={action === 'accept' ? 'text-green-500' : 'text-gray-400'}
                  />
                  <span className={`font-bold ${
                    action === 'accept' ? 'text-green-500' : 'text-gray-400'
                  }`}>
                    Принять
                  </span>
                </div>
                {action === 'accept' && (
                  <div className="absolute top-2 right-2 w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                )}
              </button>

              {/* Отклонить */}
              <button
                type="button"
                onClick={() => setAction('reject')}
                disabled={!isLocked}
                className={`relative p-6 rounded-xl border-2 transition-all ${
                  isLocked ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'
                } ${
                  action === 'reject'
                    ? 'border-red-500 bg-red-500/10'
                    : 'border-gray-500/20 hover:border-gray-500/40'
                }`}
              >
                <div className="flex flex-col items-center gap-2">
                  <XCircle
                    size={32}
                    className={action === 'reject' ? 'text-red-500' : 'text-gray-400'}
                  />
                  <span className={`font-bold ${
                    action === 'reject' ? 'text-red-500' : 'text-gray-400'
                  }`}>
                    Отклонить
                  </span>
                </div>
                {action === 'reject' && (
                  <div className="absolute top-2 right-2 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                )}
              </button>
            </div>

            {/* Описание действия */}
            <div className={`p-4 rounded-xl text-sm ${
              action === 'accept'
                ? 'bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20'
                : 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20'
            }`}>
              {action === 'accept' ? (
                <>
                  <strong>Принять ТМЦ</strong>
                  <p className="mt-1 opacity-80">
                    Статус изменится на "Выдано". ТМЦ будет закреплено за вами.
                  </p>
                </>
              ) : (
                <>
                  <strong>Отклонить ТМЦ</strong>
                  <p className="mt-1 opacity-80">
                    ТМЦ будет возвращено на исходный объект с прежним ответственным.
                  </p>
                </>
              )}
            </div>

            {/* Кнопки действий */}
            <div className="flex gap-3 mt-6">
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
                onClick={handleSubmit}
                disabled={loading || !isLocked}
                className={`flex-1 py-3 rounded-xl font-bold text-white shadow-lg transition-all ${
                  loading || !isLocked
                    ? 'bg-blue-600/50 cursor-not-allowed'
                    : action === 'accept'
                      ? 'bg-green-600 hover:bg-green-500 active:scale-95 shadow-green-900/20'
                      : 'bg-red-600 hover:bg-red-500 active:scale-95 shadow-red-900/20'
                }`}
              >
                {loading ? 'Обработка...' : action === 'accept' ? 'Принять' : 'Отклонить'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmTMCModal;

