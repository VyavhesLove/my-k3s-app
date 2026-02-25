// components/modals/ServiceModal/ServiceModal.jsx
import React, { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useItemStore } from '@/store/useItemStore';
import { useServiceModal } from '@/hooks/useServiceModal';
import { ServiceModalHeader } from './ServiceModalHeader';
import { ServiceModalItemInfo } from './ServiceModalItemInfo';
import { ServiceModalRepairAction } from './ServiceModalRepairAction';
import { ServiceModalFormFields } from './ServiceModalFormFields';
import { ServiceModalFooter } from './ServiceModalFooter';

export const ServiceModal = ({ isDarkMode }) => {
  const { selectedItem, isServiceModalOpen } = useItemStore();
  
  const {
    isSend,
    isConfirm,
    isReturn,
    isLocked,
    loading,
    availableQty,
    schema,
    title,
    buttonText,
    handleClose,
    onSubmit,
    loadQty,
  } = useServiceModal({ isDarkMode });

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      comment: '',
      repairAction: 'confirm',
      invoiceNumber: '',
      location: '',
    },
  });

  const watchedRepairAction = watch('repairAction');

  // Загрузка qty при переключении действия
  useEffect(() => {
    loadQty(watchedRepairAction);
  }, [watchedRepairAction, loadQty]);

  // Сброс repairAction при изменении статуса
  useEffect(() => {
    if (selectedItem?.status === 'confirm_repair') {
      setValue('repairAction', 'confirm');
    }
  }, [selectedItem?.status, setValue]);

  // Сброс формы при закрытии
  useEffect(() => {
    if (!isServiceModalOpen) {
      reset();
    }
  }, [isServiceModalOpen, reset]);

  if (!isServiceModalOpen || !selectedItem) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div 
        className={`w-full max-w-2xl rounded-2xl shadow-2xl transform transition-all ${
          isDarkMode ? 'bg-slate-900 text-white border border-slate-700' : 'bg-white text-slate-900'
        }`}
      >
        <ServiceModalHeader 
          title={title}
          isLocked={isLocked}
          isDarkMode={isDarkMode}
          onClose={handleClose}
        />
        
        <form onSubmit={handleSubmit(onSubmit)} className="p-6">
          <ServiceModalItemInfo 
            item={selectedItem}
            isDarkMode={isDarkMode}
          />

          {/* Предупреждение о блокировке */}
          {!isLocked && (
            <div className="mb-6 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center gap-2">
              <span className="text-amber-600 dark:text-amber-400 text-sm">
                Этот ТМЦ заблокирован другим пользователем
              </span>
            </div>
          )}

          {/* Выбор действия для статуса confirm_repair */}
          {isConfirm && selectedItem?.status === 'confirm_repair' && (
            <ServiceModalRepairAction 
              control={control}
              watchedRepairAction={watchedRepairAction}
              isLocked={isLocked}
              isDarkMode={isDarkMode}
              availableQty={availableQty}
              errors={errors}
              register={register}
            />
          )}

          {/* Поля для статуса confirm (простое подтверждение) */}
          {isConfirm && selectedItem?.status === 'confirm' && (
            <ServiceModalFormFields 
              isSend={isSend}
              isConfirm={isConfirm}
              isReturn={isReturn}
              status={selectedItem?.status}
              isDarkMode={isDarkMode}
              register={register}
              errors={errors}
            />
          )}

          {/* Комментарий для send и return */}
          {(isSend || isReturn) && (
            <ServiceModalFormFields 
              isSend={isSend}
              isConfirm={isConfirm}
              isReturn={isReturn}
              status={selectedItem?.status}
              isDarkMode={isDarkMode}
              register={register}
              errors={errors}
            />
          )}

          <ServiceModalFooter 
            isDarkMode={isDarkMode}
            loading={loading}
            isConfirm={isConfirm}
            status={selectedItem?.status}
            watchedRepairAction={watchedRepairAction}
            buttonText={buttonText}
            onCancel={handleClose}
            onSubmit={handleSubmit(onSubmit)}
          />
        </form>
      </div>
    </div>
  );
};

