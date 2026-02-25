// hooks/useServiceModal.js - бизнес-логика для ServiceModal
import { useState, useEffect, useMemo } from 'react';
import api from '@/api/axios';
import { toast } from 'sonner';
import { useItemStore } from '@/store/useItemStore';
import { getServiceSchema } from '@/schemas/service';

/**
 * Хук для управления логикой ServiceModal
 */
export const useServiceModal = () => {
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

  const [loading, setLoading] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [availableQty, setAvailableQty] = useState(null);

  // Режимы работы
  const isSend = serviceMode === 'send';
  const isConfirm = serviceMode === 'confirm';
  const isReturn = serviceMode === 'return';

  // Динамическая схема
  const schema = useMemo(() => {
    if (isConfirm && selectedItem?.status === 'confirm') {
      return getServiceSchema('confirmSimple');
    }
    return getServiceSchema(serviceMode);
  }, [serviceMode, isConfirm, selectedItem?.status]);

  // Проверка остатков
  const checkQty = async () => {
    if (!selectedItem) return true;
    try {
      const response = await api.get(`/items/${selectedItem.id}/qty/`);
      const qty = response.data.data.qty;
      if (qty < 1) {
        toast.error(`Недостаточное количество на складе. Доступно: ${qty}`);
        return false;
      }
      return true;
    } catch (err) {
      console.error('Ошибка проверки остатков:', err);
      return true;
    }
  };

  // Загрузка qty при переключении на "Списать"
  const loadQty = async (repairAction) => {
    if (repairAction === 'write_off' && selectedItem) {
      try {
        const res = await api.get(`/items/${selectedItem.id}/qty/`);
        setAvailableQty(res.data.data.qty);
      } catch (err) {
        console.error('Ошибка загрузки qty:', err);
        setAvailableQty(null);
      }
    } else {
      setAvailableQty(null);
    }
  };

  // Блокировка ТМЦ при открытии
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

  // Закрытие модалки с разблокировкой
  const handleClose = async () => {
    if (isLocked && selectedItem) {
      try {
        await unlockItem(selectedItem.id);
      } catch (err) {
        console.error('Ошибка разблокировки:', err);
      }
    }
    setIsLocked(false);
    setAvailableQty(null);
    closeServiceModal();
  };

  // Основной submit
  const onSubmit = async (data) => {
    if (!isLocked) {
      toast.error('Невозможно выполнить операцию', {
        description: 'ТМЦ заблокировано другим пользователем'
      });
      return;
    }

    // Проверка остатков для списания
    if (isConfirm && selectedItem.status === 'confirm_repair' && data.repairAction === 'write_off') {
      const hasEnoughQty = await checkQty();
      if (!hasEnoughQty) return;
    }

    setLoading(true);
    try {
      if (isSend) {
        await api.patch(`/items/${selectedItem.id}/`, {
          status: 'confirm_repair',
          service_comment: data.comment
        });
        toast.success("ТМЦ отправлено в сервис");
      } 
      else if (isConfirm && selectedItem.status === 'confirm_repair') {
        if (data.repairAction === 'confirm') {
          await api.post(`/items/${selectedItem.id}/confirm-repair/`, {
            invoice_number: data.invoiceNumber,
            location: data.location
          });
          toast.success("Ремонт согласован");
        } else {
          await api.post(`/items/${selectedItem.id}/write-off-from-confirm-repair/`, {
            reason: data.comment || "Списание из подтверждения ремонта"
          });
          toast.success("ТМЦ списано");
        }
      }
      else if (isConfirm && selectedItem.status === 'confirm') {
        await api.post(`/items/${selectedItem.id}/confirm/`, {
          comment: data.comment
        });
        toast.success("ТМЦ подтверждено");
      } 
      else if (isReturn) {
        await api.post(`/items/${selectedItem.id}/return-from-service/`, {
          comment: data.comment
        });
        toast.success("ТМЦ принято из ремонта");
      }

      await refreshItems();
      setSelectedItem(null);
      await unlockItem(selectedItem.id);
      setIsLocked(false);
      handleClose();
    } catch (err) {
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

  // Заголовок и текст кнопки
  const title = useMemo(() => {
    if (isSend) return 'Отправить в сервис';
    if (isConfirm && selectedItem?.status === 'confirm_repair') return 'Подтвердить ремонт';
    if (isConfirm && selectedItem?.status === 'confirm') return 'Подтвердить ТМЦ';
    return 'Принять из ремонта';
  }, [isSend, isConfirm, selectedItem?.status]);

  const buttonText = useMemo(() => {
    if (isSend) return 'Отправить';
    if (isConfirm && selectedItem?.status === 'confirm') return 'Подтвердить';
    return 'Принять';
  }, [isSend, isConfirm, selectedItem?.status]);

  return {
    // Состояние
    selectedItem,
    isServiceModalOpen,
    isSend,
    isConfirm,
    isReturn,
    isLocked,
    loading,
    availableQty,
    schema,
    title,
    buttonText,
    // Методы
    handleClose,
    onSubmit,
    loadQty,
    setLoading,
  };
};

