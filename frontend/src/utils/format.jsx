import React from 'react';
import { Monitor, Smartphone } from 'lucide-react';

// Утилиты для форматирования данных

/**
 * Форматирование даты в русском формате
 * @param {string} dateString - Строка с датой
 * @returns {string} Отформатированная дата
 */
export const formatDate = (dateString) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

/**
 * Получение иконки устройства по User Agent
 * @param {string} userAgent - User Agent браузера
 * @returns {JSX.Element} Иконка устройства
 */
export const getDeviceIcon = (userAgent) => {
  if (!userAgent) return <Monitor size={16} />;
  const ua = userAgent.toLowerCase();
  if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
    return <Smartphone size={16} />;
  }
  return <Monitor size={16} />;
};

