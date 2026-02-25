// schemas/service.js - схемы для модалки сервисного обслуживания
import { z } from 'zod';

/**
 * Схема отправки в ремонт (send)
 * comment обязателен - нужно указать причину отправки на ремонт
 */
export const serviceSendSchema = z.object({
  comment: z.string().min(1, 'Укажите причину отправки на ремонт'),
});

/**
 * Схема подтверждения ремонта (confirm)
 * Для статуса confirm_repair - выбор между подтверждением ремонта или списанием
 */
export const serviceConfirmSchema = z.object({
  comment: z.string().optional(),
  repairAction: z.enum(['confirm', 'write_off'], {
    errorMap: () => ({ message: 'Выберите действие' }),
  }),
  invoiceNumber: z.string().optional(),
  location: z.string().optional(),
}).refine((data) => {
  // Если выбрано "подтвердить ремонт" - обязательны invoiceNumber и location
  if (data.repairAction === 'confirm') {
    return data.invoiceNumber && data.invoiceNumber.trim().length > 0 &&
           data.location && data.location.trim().length > 0;
  }
  return true;
}, {
  message: 'Укажите номер счёта и локацию для подтверждения ремонта',
  path: ['invoiceNumber'],
});

/**
 * Схема возврата из ремонта (return)
 * comment опционально
 */
export const serviceReturnSchema = z.object({
  comment: z.string().optional(),
});

/**
 * Factory функция - возвращает схему в зависимости от режима
 * @param {string} mode - режим работы: 'send', 'confirm', 'return'
 * @returns {z.ZodSchema} схема для валидации
 */
export const getServiceSchema = (mode) => {
  const schemas = {
    send: serviceSendSchema,
    confirm: serviceConfirmSchema,
    return: serviceReturnSchema,
  };
  return schemas[mode] || serviceSendSchema;
};

