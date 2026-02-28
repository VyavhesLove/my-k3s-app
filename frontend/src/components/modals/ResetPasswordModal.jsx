import React, { useState } from 'react';
import { X, Eye, EyeOff, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { resetUserPassword } from '@/api/userApi';

export const ResetPasswordModal = ({ isOpen, onClose, user, isDarkMode }) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Сброс формы
  const resetForm = () => {
    setNewPassword('');
    setConfirmPassword('');
    setShowNewPassword(false);
    setShowConfirmPassword(false);
    setIsSubmitting(false);
  };

  // Закрытие модалки сбросом формы
  const handleClose = () => {
    resetForm();
    onClose();
  };

  // Обработчик изменения пароля
  const handleNewPasswordChange = (e) => {
    setNewPassword(e.target.value);
  };

  // Обработчик изменения подтверждения пароля
  const handleConfirmPasswordChange = (e) => {
    setConfirmPassword(e.target.value);
  };

  // Отправка формы сброса пароля
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Валидация: пароли должны совпадать
    if (newPassword !== confirmPassword) {
      toast.error('Пароли отличаются');
      return;
    }

    // Валидация: пароль не должен быть пустым
    if (!newPassword || !confirmPassword) {
      toast.error('Пожалуйста, заполните оба поля пароля');
      return;
    }

    setIsSubmitting(true);

    try {
      await resetUserPassword(user.id, newPassword, confirmPassword);
      toast.success('Пароль успешно изменен');
      handleClose();
    } catch (error) {
      // Обработка ошибок от сервера
      const errorMessage = error?.message || error?.detail || 'Ошибка при сбросе пароля';
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Обработчик кнопки "Отправить на Email" (заглушка)
  const handleSendToEmail = () => {
    // Проверка на заполненность email
    if (!user.email) {
      toast.error('❌ Функция еще не реализована', {
        description: 'Не заполнен email пользователя',
      });
      return;
    }

    // Проверка: пароли должны быть заполнены
    if (!newPassword || !confirmPassword) {
      toast.error('❌ Заполните оба поля пароля', {
        description: 'Перед отправкой email нужно ввести и подтвердить пароль',
      });
      return;
    }

    // Проверка: пароли должны совпадать
    if (newPassword !== confirmPassword) {
      toast.error('❌ Пароли отличаются', {
        description: 'Поля "Новый пароль" и "Подтверждение пароля" должны совпадать',
      });
      return;
    }

    // Подготовка данных для отправки email
    const emailSubject = 'Ваш пароль в системе Склад ТМЦ был изменен';
    const emailRecipient = user.email;
    const emailBody = `Новый пароль: ${newPassword}`;

    // Для отладки - выводим сформированное сообщение в консоль
    console.log('=== ОТЛАДКА: Отправка email ===');
    console.log('Получатель:', emailRecipient);
    console.log('Тема:', emailSubject);
    console.log('Тело письма:', emailBody);
    console.log('================================');

    toast.info('Функция еще не реализована', {
      description: `Письмо на ${user.email} не отправлено (отладка в консоли)`,
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Оверлей */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleClose} />

      {/* Контент модалки */}
      <div className={`relative w-full max-w-md p-6 rounded-2xl shadow-2xl transition-all ${
        isDarkMode ? 'bg-slate-900 text-white border border-slate-700' : 'bg-white text-slate-900'
      }`}>
        {/* Заголовок */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold">Сброс пароля</h2>
          </div>
          <button 
            onClick={handleClose} 
            className="hover:opacity-70 transition-opacity"
          >
            <X size={24} />
          </button>
        </div>

        {/* Информация о пользователе */}
        <div className={`mb-6 p-3 rounded-lg ${
          isDarkMode ? 'bg-slate-800' : 'bg-gray-100'
        }`}>
          <p className="text-sm">
            <span className="font-medium">Пользователь: </span>
            {user.username} ({user.email})
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Новый пароль */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Новый пароль <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showNewPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={handleNewPasswordChange}
                className={`w-full p-2 pr-10 rounded-lg border outline-none focus:ring-2 focus:ring-blue-500 ${
                  isDarkMode 
                    ? 'bg-slate-800 border-slate-700' 
                    : 'bg-gray-50 border-gray-300'
                }`}
                placeholder="Введите новый пароль"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-2 top-1/2 -translate-y-1/2 hover:opacity-70 transition-opacity"
              >
                {showNewPassword ? (
                  <EyeOff size={20} className="text-gray-500" />
                ) : (
                  <Eye size={20} className="text-gray-500" />
                )}
              </button>
            </div>
          </div>

          {/* Подтверждение пароля */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Подтверждение пароля <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={handleConfirmPasswordChange}
                className={`w-full p-2 pr-10 rounded-lg border outline-none focus:ring-2 focus:ring-blue-500 ${
                  isDarkMode 
                    ? 'bg-slate-800 border-slate-700' 
                    : 'bg-gray-50 border-gray-300'
                }`}
                placeholder="Повторите пароль"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-2 top-1/2 -translate-y-1/2 hover:opacity-70 transition-opacity"
              >
                {showConfirmPassword ? (
                  <EyeOff size={20} className="text-gray-500" />
                ) : (
                  <Eye size={20} className="text-gray-500" />
                )}
              </button>
            </div>
          </div>

          {/* Кнопки */}
          <div className="flex flex-col gap-3 mt-6">
            {/* Кнопка "Изменить" - основная */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  Изменение...
                </>
              ) : (
                'Изменить'
              )}
            </button>

            {/* Кнопка "Отправить на Email" - заглушка */}
            <button
              type="button"
              onClick={handleSendToEmail}
              className={`w-full py-3 px-4 font-bold rounded-xl transition-colors ${
                isDarkMode 
                  ? 'bg-slate-700 hover:bg-slate-600 text-slate-400' 
                  : 'bg-gray-300 hover:bg-gray-400 text-gray-600'
              }`}
            >
              Отправить на Email
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

