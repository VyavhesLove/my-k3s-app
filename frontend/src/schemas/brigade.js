// schemas/brigade.js - схемы для бригад
import { z } from 'zod';
import { requiredString, minString } from './base';

/**
 * Схема создания/редактирования бригады
 */
export const brigadeSchema = z.object({
  name: minString(2, 'Название бригады'),
  brigadier: requiredString('Бригадир'),
  responsible: requiredString('Ответственный'),
  description: z.string().optional(),
  members: z.array(z.number()).optional(),
}).refine((data) => data.brigadier !== data.responsible, {
  message: 'Бригадир и ответственный не могут быть одним человеком',
  path: ['responsible'],
});

/**
 * Схема для фильтрации бригад
 */
export const brigadeSearchSchema = z.object({
  search: z.string().optional(),
});

