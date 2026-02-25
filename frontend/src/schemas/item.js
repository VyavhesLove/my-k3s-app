// schemas/item.js - схемы для ТМЦ
import { z } from 'zod';
import { requiredString } from './base';

/**
 * Схема создания/редактирования ТМЦ
 * serial может быть "отсутствует" если noSerial = true
 */
export const itemSchema = z.object({
  name: requiredString('Наименование'),
  serial: requiredString('Серийный номер'),
  brand: z.string().optional(),
  noSerial: z.boolean().optional(),
}).refine((data) => {
  // Если noSerial = true, то serial не обязателен
  if (data.noSerial) return true;
  // Иначе serial должен быть заполнен
  return data.serial && data.serial.trim().length > 0;
}, {
  message: 'Заполните серийный номер или активируйте чекбокс "Серийный номер отсутствует"',
  path: ['serial'],
});

/**
 * Упрощённая схема для ТМЦ (используется в форме с отдельной валидацией noSerial)
 */
export const itemSchemaSimple = z.object({
  name: requiredString('Наименование'),
  serial: z.string().optional(),
  brand: z.string().optional(),
  noSerial: z.boolean().optional(),
});

/**
 * Схема для фильтрации/поиска ТМЦ
 */
export const itemSearchSchema = z.object({
  search: z.string().optional(),
  status: z.string().optional(),
  location: z.string().optional(),
});

/**
 * Схема передачи ТМЦ (TransferModal)
 */
export const transferSchema = z.object({
  targetLocation: z.string().min(1, 'Выберите локацию'),
  responsible: z.string().min(1, 'Укажите ответственного'),
});

/**
 * Схема передачи ТМЦ в работу (AtWorkModal)
 */
export const atWorkSchema = z.object({
  selectedBrigade: z.string().min(1, 'Выберите бригаду'),
});

