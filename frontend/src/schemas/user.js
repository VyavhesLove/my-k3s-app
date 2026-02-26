// schemas/user.js - схемы для пользовательских форм
import { z } from 'zod';
import { requiredString, minString, emailSchema } from './base';

/**
 * Схема входа в систему
 */
export const loginSchema = z.object({
  username: requiredString('Логин'),
  password: requiredString('Пароль'),
});

/**
 * Схема смены пароля
 */
export const passwordChangeSchema = z.object({
  current_password: requiredString('Текущий пароль'),
  new_password: minString(8, 'Новый пароль'),
  confirm_password: requiredString('Подтверждение пароля'),
}).refine((data) => data.new_password === data.confirm_password, {
  message: 'Пароли не совпадают',
  path: ['confirm_password'],
});

/**
 * Схема профиля пользователя
 */
export const profileSchema = z.object({
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  email: emailSchema,
  phone: z.string().optional(),
});

/**
 * Схема создания пользователя
 */
export const userCreateSchema = z.object({
  username: minString(3, 'Логин'),
  email: emailSchema,
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  role: z.enum(['admin', 'storekeeper', 'foreman']).optional(),
  password: minString(8, 'Пароль'),
  confirm_password: requiredString('Подтверждение пароля'),
}).refine((data) => data.password === data.confirm_password, {
  message: 'Пароли не совпадают',
  path: ['confirm_password'],
});

