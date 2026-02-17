import React, { useState, useEffect } from 'react';
import { X, Wrench, FileX } from 'lucide-react';
import api from '@/api/axios';
import { toast } from 'sonner';
import { useItemStore } from '@/store/useItemStore';

const ServiceModal = ({ isDarkMode }) => {
  const { 
    selectedItem, 
    serviceMode, 
    isServiceModalOpen, 
    closeServiceModal,
    lockItem,
    unlockItem,
    refreshItems,
    setSelectedItem
  } = useItemStore();

  const [comment, setComment] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [location, setLocation] = useState('');
  const [loading, setLoading] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [qtyError, setQtyError] = useState(null);
  
  // Для статуса confirm_repair - выбор действия: подтвердить ремонт или списать
  const [repairAction, setRepairAction] = useState('confirm'); // 'confirm' или 'write_off'

  // Проверка остатков при выборе "Списать"
  const checkQty = async () => {
    if (!selectedItem) return;
    
    try {
      const response = await api.get(`/items/${selectedItem.id}/qty/`);
      const availableQty = response.data.data.qty;
      
      if (availableQty < 1) {
        setQtyError(`Недостаточное количество на складе. Доступно: ${availableQty}`);
        return false;
      }
      
      setQtyError(null);
      return true;
    } catch (err) {
      console.error('Ошибка проверки остатков:', err);
      // Не блокируем отправку при ошибке проверки - пусть бэкенд проверит
      setQtyError(null);
      return true;
    }
  };
  
  // Загрузка qty при выборе "Списать"
  const [availableQty, setAvailableQty] = useState(null);
  
  useEffect(() => {
    if (repairAction === 'write_off' && selectedItem) {
      // Загружаем количество при переключении на "Списать"
      api.get(`/items/${selectedItem.id}/qty/`)
        .then(res => {
          setAvailableQty(res.data.data.qty);
        })
        .catch(err => {
          console.error('Ошибка загрузки qty:', err);
          setAvailableQty(null);
        });
    } else {
      setAvailableQty(null);
    }
  }, [repairAction, selectedItem]);

  // При открытии модалки - пробуем заблокировать ТМЦ
  useEffect(() => {
    if (isServiceModalOpen && selectedItem) {
      const doLock = async () => {
        try {
          await lockItem(selectedItem.id);
          setIsLocked(true);
          toast.success('🔓 ТМЦ заблокировано для редактирования', {
            description: 'Вы можете безопасно редактировать'
          });
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
  }, [isServiceModalOpen, selectedItem, lockItem]);

  // Сброс ошибки qty при закрытии
  useEffect(() => {
    if (!isServiceModalOpen) {
      setQtyError(null);
    }
  }, [isServiceModalOpen]);

  // При закрытии - разблокируем
  const handleClose = async () => {
    if (isLocked && selectedItem) {
      try {
        await unlockItem(selectedItem.id);
      } catch (err) {
        console.error('Ошибка разблокировки:', err);
      }
    }
    setComment('');
    setInvoiceNumber('');
    setLocation('');
    setRepairAction('confirm');
    setIsLocked(false);
    setQtyError(null);
    closeServiceModal();
  };

  // Сброс полей при изменении статуса ТМЦ
  useEffect(() => {
    if (selectedItem?.status === 'confirm_repair') {
      setRepairAction('confirm');
    }
  }, [selectedItem?.status]);

  if (!isServiceModalOpen || !selectedItem) return null;

  const isSend = serviceMode === 'send';
  const isConfirm = serviceMode === 'confirm';
  const isReturn = serviceMode === 'return';

  const title = isSend 
    ? 'Отправить в сервис' 
    : isConfirm && selectedItem?.status === 'confirm_repair' && repairAction === 'write_off'
      ? 'Списание ТМЦ'
      : isConfirm && selectedItem?.status === 'confirm_repair'
        ? 'Подтвердить ремонт'
        : isConfirm && selectedItem?.status === 'confirm'
          ? 'Подтвердить ТМЦ'
          : 'Принять из ремонта';
  
  const buttonText = isSend 
    ? 'Отправить' 
    : isConfirm && selectedItem?.status === 'confirm_repair' && repairAction === 'write_off'
      ? 'Списать'
      : isConfirm && selectedItem?.status === 'confirm_repair'
        ? 'Подтвердить ремонт'
        : isConfirm && selectedItem?.status === 'confirm'
          ? 'Подтвердить'
          : 'Принять';

  const handleSubmit = async () => {
    if (!isLocked) {
      toast.error('Невозможно выполнить операцию', {
        description: 'ТМЦ заблокирован другим пользователем'
      });
      return;
    }

    // Для операции списания - проверяем остатки перед отправкой
    if (isConfirm && selectedItem.status === 'confirm_repair' && repairAction === 'write_off') {
      const hasEnoughQty = await checkQty();
      if (!hasEnoughQty) {
        return; // Не продолжаем если недостаточно остатков
      }
    }

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
      else if (isConfirm && selectedItem.status === 'confirm_repair') {
        // Подтверждение ремонта или списание из статуса confirm_repair
        if (repairAction === 'confirm') {
          // Подтверждение ремонта
          if (!invoiceNumber.trim()) {
            setLoading(false);
            return toast.error("Укажите номер счета");
          }
          if (!location.trim()) {
            setLoading(false);
            return toast.error("Укажите локацию сервиса");
          }
          
          await api.post(`/items/${selectedItem.id}/confirm-repair/`, {
            invoice_number: invoiceNumber,
            location: location
          });
          toast.success("Ремонт согласован");
        } else if (repairAction === 'write_off') {
          // Списание ТМЦ из подтверждения ремонта
          await api.post(`/items/${selectedItem.id}/write-off-from-confirm-repair/`, {
            reason: comment || "Списание из подтверждения ремонта"
          });
          toast.success("ТМЦ списано");
        }
      }
      else if (isConfirm && selectedItem.status === 'confirm') {
        // Простое подтверждение ТМЦ (confirm -> available)
        await api.post(`/items/${selectedItem.id}/confirm/`, {
          comment: comment
        });
        toast.success("ТМЦ подтверждено");
      } 
      else if (isReturn) {
        // Возврат из сервиса
        await api.post(`/items/${selectedItem.id}/return-from-service/`, {
          comment: comment
        });
        toast.success("ТМЦ принято из ремонта");
      }

      // ✅ Обновляем список через Zustand
      await refreshItems();
      setSelectedItem(null);

      // Разблокируем
      await unlockItem(selectedItem.id);
      setIsLocked(false);

      handleClose();
    } catch (err) {
      // Обработка ошибки недостаточного количества от бэкенда
      if (err.response?.data?.error) {
        toast.error(err.response.data.error);
      } else {
        toast.error(err.response?.data?.detail || "Ошибка при выполнении операции");
      }
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
          <h2 className="text-xl font-bold uppercase tracking-tight">
            {title}
            {isLocked && (
              <span className="ml-2 text-xs text-green-500 font-normal">
                🔓 Заблокировано
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

          {/* Выбор действия для статуса confirm_repair */}
          {isConfirm && selectedItem?.status === 'confirm_repair' && (
            <div className="space-y-4 mb-6">
              <label className="block text-sm font-medium uppercase tracking-wider text-gray-500">
                Выберите действие
              </label>

              <div className="grid grid-cols-2 gap-4">
                {/* В ремонт */}
                <button
                  type="button"
                  onClick={() => setRepairAction('confirm')}
                  disabled={!isLocked}
                  className={`relative p-4 rounded-xl border-2 transition-all ${
                    isLocked ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'
                  } ${
                    repairAction === 'confirm'
                      ? 'border-green-500 bg-green-500/10'
                      : 'border-gray-500/20 hover:border-gray-500/40'
                  }`}
                >
                  <div className="flex flex-col items-center gap-2">
                    <Wrench
                      size={28}
                      className={repairAction === 'confirm' ? 'text-green-500' : 'text-gray-400'}
                    />
                    <span className={`font-bold ${
                      repairAction === 'confirm' ? 'text-green-500' : 'text-gray-400'
                    }`}>
                      В ремонт
                    </span>
                  </div>
                  {repairAction === 'confirm' && (
                    <div className="absolute top-2 right-2 w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                  )}
                </button>

                {/* Списать */}
                <button
                  type="button"
                  onClick={() => setRepairAction('write_off')}
                  disabled={!isLocked}
                  className={`relative p-4 rounded-xl border-2 transition-all ${
                    isLocked ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'
                  } ${
                    repairAction === 'write_off'
                      ? 'border-red-500 bg-red-500/10'
                      : 'border-gray-500/20 hover:border-gray-500/40'
                  }`}
                >
                  <div className="flex flex-col items-center gap-2">
                    <FileX
                      size={28}
                      className={repairAction === 'write_off' ? 'text-red-500' : 'text-gray-400'}
                    />
                    <span className={`font-bold ${
                      repairAction === 'write_off' ? 'text-red-500' : 'text-gray-400'
                    }`}>
                      Списать
                    </span>
                  </div>
                  {repairAction === 'write_off' && (
                    <div className="absolute top-2 right-2 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                  )}
                </button>
              </div>

              {/* Поля для подтверждения ремонта (когда выбрано "В ремонт") */}
              {repairAction === 'confirm' && (
                <div className="space-y-4 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
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

              {/* Комментарий для списания (когда выбрано "Списать") */}
              {repairAction === 'write_off' && (
                <div className="space-y-2 p-4 rounded-xl bg-red-500/10 border border-red-500/20">
                  {/* Отображение остатков */}
                  {availableQty !== null && (
                    <div className={`text-sm font-medium mb-2 ${
                      availableQty < 1 ? 'text-red-500' : 'text-green-600'
                    }`}>
                      📦 Остаток на складе: {availableQty}
                      {availableQty < 1 && ' (недостаточно!)'}
                    </div>
                  )}
                  <label className="text-xs font-bold uppercase text-red-600 ml-1">Причина списания</label>
                  <textarea 
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    disabled={availableQty !== null && availableQty < 1}
                    className={`w-full p-4 rounded-xl border outline-none transition-all resize-none ${
                      isDarkMode 
                        ? 'bg-slate-800 border-slate-700 focus:border-red-500 focus:ring-1 focus:ring-red-500' 
                        : 'bg-gray-50 border-gray-200 focus:border-red-400 focus:ring-1 focus:ring-red-400'
                    } ${availableQty !== null && availableQty < 1 ? 'opacity-50 cursor-not-allowed' : ''}`}
                    rows="3"
                    placeholder="Укажите причину списания..."
                  />
                  {/* Ошибка недостаточного количества */}
                  {qtyError && (
                    <div className="text-red-500 text-sm font-medium mt-2">
                      ⚠️ {qtyError}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Поля для статуса confirm (простое подтверждение ТМЦ) */}
          {isConfirm && selectedItem?.status === 'confirm' && (
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-gray-500 ml-1">Комментарий</label>
              <textarea 
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className={`w-full p-4 rounded-xl border outline-none transition-all resize-none ${
                  isDarkMode 
                    ? 'bg-slate-800 border-slate-700 focus:border-amber-500 focus:ring-1 focus:ring-amber-500' 
                    : 'bg-gray-50 border-gray-200 focus:border-amber-400 focus:ring-1 focus:ring-amber-400'
                }`}
                rows="3"
                placeholder="Комментарий к подтверждению (необязательно)"
              />
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
                  : isConfirm && selectedItem?.status === 'confirm_repair' && repairAction === 'write_off'
                    ? 'bg-red-600 hover:bg-red-500 active:scale-95 shadow-red-900/20'
                    : isConfirm 
                      ? 'bg-amber-500 hover:bg-amber-400 active:scale-95 shadow-amber-900/20'
                      : 'bg-blue-600 hover:bg-blue-500 active:scale-95 shadow-blue-900/20'
              }`}
            >
              {loading 
                ? 'Обработка...' 
                : isConfirm && selectedItem?.status === 'confirm_repair' && repairAction === 'write_off'
                  ? 'Списать'
                  : buttonText
              }
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServiceModal;
