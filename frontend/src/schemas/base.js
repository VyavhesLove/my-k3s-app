// schemas/base.js - общие правила валидации
import { z } from 'zod';

/**
 * Строка, которая должна быть заполнена (минимум 1 символ)
 */
export const requiredString = (fieldName = 'Поле') =>
  z.string().min(1, `${fieldName} обязательно`);

/**
 * Строка с минимальной длиной
 */
export const minString = (minLength, fieldName = 'Поле') =>
  z.string().min(minLength, `${fieldName} должно содержать минимум ${minLength} символов`);

/**
 * Email валидация
 */
export const emailSchema = z.string().email('Некорректный email').or(z.literal(''));

/**
 * Опциональная строка
 */
export const optionalString = z.string().optional();

/**
 * Число должно быть положительным
 */
export const positiveNumber = (fieldName = 'Значение') =>
  z.number({ invalid_type_error: `${fieldName} должно быть числом` })
    .positive(`${fieldName} должно быть положительным числом`);

/**
 * Целое число
 */
export const integerNumber = (fieldName = 'Значение') =>
  z.number({ invalid_type_error: `${fieldName} должно быть числом` })
    .int(`${fieldName} должно быть целым числом`);

