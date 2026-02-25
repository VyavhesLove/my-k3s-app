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
  // Если выбрано "подтвердить ремонт" - обязателен invoiceNumber
  if (data.repairAction === 'confirm') {
    return data.invoiceNumber && data.invoiceNumber.trim().length > 0;
  }
  return true;
}, {
  message: 'Укажите номер счёта для подтверждения ремонта',
  path: ['invoiceNumber'],
}).refine((data) => {
  // Если выбрано "подтвердить ремонт" - обязательна location
  if (data.repairAction === 'confirm') {
    return data.location && data.location.trim().length > 0;
  }
  return true;
}, {
  message: 'Укажите локацию для подтверждения ремонта',
  path: ['location'],
});

/**
 * Схема возврата из ремонта (return)
 * comment опционально
 */
export const serviceReturnSchema = z.object({
  comment: z.string().optional(),
});

/**
 * Схема простого подтверждения ТМЦ (confirm)
 * Используется когда нужно просто подтвердить ТМЦ без дополнительных действий
 * comment опционально
 */
export const confirmSimpleSchema = z.object({
  comment: z.string().optional(),
});

/**
 * Factory функция - возвращает схему в зависимости от режима
 * @param {string} mode - режим работы: 'send', 'confirm', 'confirmSimple', 'return'
 * @returns {z.ZodSchema} схема для валидации
 */
export const getServiceSchema = (mode) => {
  const schemas = {
    send: serviceSendSchema,
    confirm: serviceConfirmSchema,
    confirmSimple: confirmSimpleSchema,
    return: serviceReturnSchema,
  };
  return schemas[mode] || serviceSendSchema;
};

