# TODO: Реализация сброса пароля в UserDetailPanel

## Задача
Реализовать функционал сброса пароля для пользователя с модальным окном.

---

## Шаг 1: Создать API функцию для сброса пароля
**Файл:** `my-k3s-app/frontend/src/api/userApi.js`

- [x] Добавить функцию `resetUserPassword(userId, newPassword, confirmPassword)`
- [x] Эндпоинт: `POST /users/{userId}/reset-password/`
- [x] Тело запроса: `{ new_password: "...", confirm_password: "..." }`
- [x] Обработка ошибок и успешного ответа
- [x] **ВНИМАНИЕ:** Создан отдельный эндпоинт `/users/{userId}/reset-password/` для сброса пароля админом (без `current_password`)

---

## Шаг 2: Создать модальное окно "Сброс пароля"
**Файл:** `my-k3s-app/frontend/src/components/modals/ResetPasswordModal.jsx`

- [x] Создать компонент `ResetPasswordModal`
- [x] Props: `isOpen, onClose, user, isDarkMode`
- [x] **Состояние формы:**
  - [x] `newPassword` (строка)
  - [x] `confirmPassword` (строка)
  - [x] `showNewPassword` (boolean) - для иконки глаза
  - [x] `showConfirmPassword` (boolean) - для иконки глаза
  - [x] `isSubmitting` (boolean)

- [x] **UI элементы:**
  - [x] Заголовок: "Сброс пароля"
  - [x] Поле "Новый пароль" с иконкой глаза справа (lucide-react: Eye, EyeOff)
  - [x] Поле "Подтверждение пароля" с иконкой глаза справа
  - [x] Информация о пользователе: "Пользователь: {username} ({email})"

- [x] **Кнопка "Изменить":**
  - [x] Основная кнопка синего/зеленого цвета
  - [x] Вызывает API сброса пароля
  - [x] При успехе: toast.success("Пароль успешно изменен")
  - [x] При ошибке валидации: toast.error("Пароли отличаются")
  - [x] При ошибке API: toast.error(сообщение об ошибке)

- [x] **Кнопка "Отправить на Email" (заглушка):**
  - [x] Темно-серая кнопка с серым текстом
  - [x] При клике: 
    - [x] toast.info("Функция еще не реализована")
    - [x] toast(`Письмо на ${user.email} не отправлено`)

- [x] **Стили:**
  - [x] Соответствовать дизайну CreateUserModal
  - [x] Поддержка isDarkMode

---

## Шаг 3: Интегрировать модалку в UserDetailPanel
**Файл:** `my-k3s-app/frontend/src/components/UserDetailPanel.jsx`

- [x] Добавить импорт ResetPasswordModal
- [x] Добавить состояние `isResetPasswordModalOpen`
- [x] Обновить `handleResetPassword` - открывать модалку вместо console.log
- [x] Добавить рендер ResetPasswordModal
- [x] Передать пропсы: `isOpen={isResetPasswordModalOpen}`, `onClose={() => setIsResetPasswordModalOpen(false)}`, `user`, `isDarkMode`

---

## Шаг 4: Проверить работу (тесты)
- [ ] Открыть панель пользователя
- [ ] Нажать кнопку "Сброс пароля"
- [ ] Проверить отображение модального окна
- [ ] Проверить иконки глазап (оказать/скрыть пароль)
- [ ] Проверить валидацию при несовпадении паролей
- [ ] Проверить успешный сброс пароля
- [ ] Проверить кнопку "Отправить на Email"
- [ ] Проверить работу в темной/светлой теме

---

Зависимости
- [x] Использовать существующие `Eye` и `EyeOff` из lucide-react (уже установлен)
- [x] Использовать `toast` из sonner (уже используется в проекте)
- [x] Использовать `api` из @/api/axios

---

## Примечание
Текущий бэкенд эндпоинт `/api/users/me/change-password/` требует `current_password`. 
Для админского сброса (без знания текущего пароля пользователя) нужно:
1. Либо создать новый эндпоинт `/api/users/{userId}/reset-password/` (рекомендуется)
2. Либо модифицировать существующий эндпоинт для поддержки special case

Рекомендуется согласовать с бэкендом перед реализацией!

