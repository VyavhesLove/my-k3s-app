# TODO: Внедрение React Hook Form + Zod

## Цель
Внедрить React Hook Form (RHF) и Zod для централизованного управления форм в проекте frontend.

## Преимущества
- **Упрощённая валидация** - Zod схемы декларативно описывают правила валидации
- **Лучшая производительность** - RHF минимизирует перерисовки
- **Типизация** - Zod обеспечивает TypeScript-подобную типизацию без TypeScript
- **Меньше boilerplate кода** - готовые методы для управления формами
- **Лёгкая интеграция с UI библиотеками** - готовая поддержка React Hook Form

---

## Шаг 1: Установка зависимостей

- [ ] `npm install react-hook-form zod @hookform/resolvers` (или добавить в package.json)

---

## Шаг 2: Создание централизованной папки для схем Zod

- [ ] Создать `/src/schemas/` директорию
- [ ] Создать базовые схемы валидации:
  - `schemas/base.js` - общие правила (required, min, max)
  - `schemas/user.js` - схемы для пользовательских форм
  - `schemas/item.js` - схемы для ТМЦ
  - `schemas/index.js` - экспорт всех схем

### Пример структуры schemas:
```js
// schemas/user.js
import { z } from 'zod';

export const loginSchema = z.object({
  username: z.string().min(1, 'Логин обязателен'),
  password: z.string().min(1, 'Пароль обязателен'),
});

export const passwordChangeSchema = z.object({
  current_password: z.string().min(1, 'Текущий пароль обязателен'),
  new_password: z.string().min(8, 'Пароль должен быть минимум 8 символов'),
  confirm_password: z.string().min(1, 'Подтверждение пароля обязательно'),
}).refine((data) => data.new_password === data.confirm_password, {
  message: 'Пароли не совпадают',
  path: ['confirm_password'],
});

export const profileSchema = z.object({
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  email: z.string().email('Некорректный email').or(z.literal('')),
});
```

---

## Шаг 3: Обновление CODING_STANDARDS.md

- [ ] Добавить раздел "Использование React Hook Form + Zod"
- [ ] Описать паттерны использования
- [ ] Примеры правильного и неправильного кода

### Пример для стандартов:
```md
## 7. Использование React Hook Form + Zod

### Всегда используйте React Hook Form + Zod для форм

**❌ Неправильно:**
```jsx
function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password) {
      setError('Заполните все поля');
      return;
    }
    // ...
  };
}
```

**✅ Правильно:**
```jsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema } from '@/schemas/user';

function LoginPage() {
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(loginSchema),
  });
  
  const onSubmit = async (data) => {
    // data уже валидирован
    await api.post('/token/', data);
  };
  
  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register('username')} />
      {errors.username && <span>{errors.username.message}</span>}
      <input type="password" {...register('password')} />
      {errors.password && <span>{errors.password.message}</span>}
    </form>
  );
}
```
```

---

## Шаг 4: Поэтапный рефакторинг форм

### Этап 4.1: LoginPage (login)
- [ ] Создать схему `loginSchema` в `schemas/user.js`
- [ ] Рефакторить `LoginPage.jsx` на RHF + Zod
- [ ] Добавить отображение ошибок валидации в toast
- [ ] Проверить работоспособность

### Этап 4.2: ItemCreate (создание/редактирование ТМЦ)
- [ ] Создать схему `itemSchema` в `schemas/item.js`
- [ ] Рефакторить `ItemCreate.jsx` на RHF + Zod
- [ ] Интегрировать логику `noSerial` чекбокса
- [ ] Проверить работоспособность

### Этап 4.3: ProfilePage (профиль пользователя)
- [ ] Создать схему `profileSchema` в `schemas/user.js`
- [ ] Рефакторить форму профиля
- [ ] Обновить `useProfile.js` хук

### Этап 4.4: PasswordForm (смена пароля)
- [ ] Создать схему `passwordChangeSchema` в `schemas/user.js`
- [ ] Рефакторить `PasswordForm.jsx` на RHF + Zod
- [ ] Убрать ручную валидацию совпадения паролей (Zod .refine)

### Этап 4.5: BrigadeModal (модалка создания бригады)
- [ ] Создать схему `brigadeSchema` в `schemas/brigade.js`
- [ ] Рефакторить `BrigadeModal.jsx` на RHF + Zod

### Этап 4.6: Остальные формы (по необходимости)
- [ ] Просканировать проект на другие формы с useState
- [ ] Определить приоритет рефакторинга
- [ ] Рефакторить оставшиеся формы

---

## Шаг 5: Создание переиспользуемых компонентов

- [ ] Создать `components/ui/FormField.jsx` - обёртка для input с ошибкой
- [ ] Создать `components/ui/FormError.jsx` - компонент для отображения ошибки
- [ ] Добавить в `components/core/index.js` экспорт новых компонентов

### Пример FormField:
```jsx
export const FormField = ({ label, error, children, required }) => (
  <div>
    {label && (
      <label className="block text-sm font-medium mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
    )}
    {children}
    {error && <p className="text-red-500 text-sm mt-1">{error.message}</p>}
  </div>
);
```

---

## Шаг 6: Тестирование

- [ ] Протестировать все рефакторинные формы
- [ ] Проверить отображение ошибок валидации
- [ ] Проверить отправку данных на сервер
- [ ] Запустить существующие тесты: `npm run test:run`

---

## Шаг 7: Обновление документации

- [ ] Обновить README проекта с описанием использования RHF + Zod
- [ ] Добавить примеры в `CODING_STANDARDS.md`

---

## Заметки

- Использовать `@hookform/resolvers` для интеграции Zod с React Hook Form
- Все новые формы создавать сразу на RHF + Zod
- Постепенный рефакторинг существующих форм (не переписывать всё сразу)
- Сохранять обратную совместимость с существующим API

## Зависимости

```
react-hook-form - основная библиотека
zod - схемы валидации
@hookform/resolvers - интеграция Zod с RHF
```

---

## Приоритеты

1. **Низкий приоритет** - формы с минимальной логикой (например, простые модалки)
2. **Средний приоритет** - часто используемые формы (Login, Profile)
3. **Высокий приоритет** - формы с сложной валидацией (PasswordForm, ItemCreate)

