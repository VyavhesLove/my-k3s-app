// schemas/maintenance.js - схемы валидации для режима обслуживания
import { z } from 'zod';

/**
 * Регулярное выражение для строгой валидации IPv4 адреса
 * Проверяет: 0-255 для каждого октета
 */
const ipv4Regex = /^((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;

/**
 * Регулярное выражение для валидации IPv6 адреса (упрощённое)
 */
const ipv6Regex = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$|^::([0-9a-fA-F]{1,4}:){0,6}[0-9a-fA-F]{1,4}$|^([0-9a-fA-F]{1,4}:){1,7}:$/;

/**
 * Схема для валидации IPv4 адреса
 */
export const ipv4AddressSchema = z
  .string()
  .regex(ipv4Regex, 'Некорректный IPv4 адрес');

/**
 * Схема для валидации IPv6 адреса
 */
export const ipv6AddressSchema = z
  .string()
  .regex(ipv6Regex, 'Некорректный IPv6 адреса');

/**
 * Схема для валидации IP адреса (IPv4 или IPv6)
 */
export const ipAddressSchema = z
  .string()
  .refine(
    (val) => ipv4Regex.test(val) || ipv6Regex.test(val),
    { message: 'Некорректный IP адрес (поддерживается IPv4 и IPv6)' }
  );

/**
 * Схема для валидации одного IP-адреса (разрешён IPv4 и IPv6)
 */
export const ipSchema = z.union([ipv4AddressSchema, ipv6AddressSchema]);

/**
 * Схема для валидации regex паттерна URL
 * Разрешает любые строки, которые могут быть использованы как regex
 */
export const urlRegexSchema = z
  .string()
  .min(1, 'URL паттерн обязателен')
  .refine(
    (val) => {
      try {
        new RegExp(val);
        return true;
      } catch {
        return false;
      }
    },
    { message: 'Некорректный regex паттерн' }
  );

/**
 * Основная схема настроек режима обслуживания
 */
export const maintenanceSettingsSchema = z.object({
  enabled: z.boolean(),
  planned_end_time: z.string().datetime().nullable().optional(),
  ips: z.array(ipSchema).default([]),
  urls: z.array(urlRegexSchema).default([]),
});

/**
 * Схема для обновления настроек (все поля опциональны)
 */
export const maintenanceSettingsUpdateSchema = maintenanceSettingsSchema.partial();

/**
 * Схема для переключения режима обслуживания
 */
export const maintenanceToggleSchema = z.object({
  enabled: z.boolean(),
  planned_end_time: z.string().datetime().nullable().optional(),
});

/**
 * Схема для добавления IP-адреса
 */
export const addIpSchema = z.object({
  ip: ipSchema,
});

/**
 * Схема для добавления URL
 */
export const addUrlSchema = z.object({
  url: urlRegexSchema,
});

/**
 * Валидировать IP адрес
 * @param {string} ip - IP адрес для валидации
 * @returns {boolean} true если валиден
 */
export const isValidIp = (ip) => {
  return ipSchema.safeParse(ip).success;
};

/**
 * Валидировать URL regex паттерн
 * @param {string} url - URL паттерн для валидации
 * @returns {boolean} true если валиден
 */
export const isValidUrlRegex = (url) => {
  return urlRegexSchema.safeParse(url).success;
};

