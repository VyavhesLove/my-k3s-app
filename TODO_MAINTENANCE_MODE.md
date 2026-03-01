# TODO: Реализация страницы настроек системы с разделом MAINTENANCE_MODE

## Анализ текущего состояния

### Backend (my-k3s-app/backend)
- **settings.py**: Содержит настройки:
  - `MAINTENANCE_MODE = False` - текущее состояние (включен/выключен)
  - `MAINTENANCE_MODE_IPS = []` - список разрешённых IP-адресов
  - `MAINTENANCE_MODE_USERS = ['admin']` - комментарий говорит "admin всегда имеет доступ", это означает что пользователи с ролью 'admin' имеют доступ
  - `MAINTENANCE_MODE_URLS = []` - список разрешённых URL (regex)
  
- **users/models.py**: Модель `MaintenanceMode` с полями:
  - `enabled` (Boolean) - включен/выключен
  - `planned_end_time` (DateTime) - планируемое время завершения
  
- **users/views/maintenance.py**: Существующие endpoints:
  - `GET /api/maintenance/status/` - получить статус
  - `POST /api/maintenance/toggle/` - включить/выключить

- **users/maintenance_backend.py**: Custom backend для хранения состояния в БД

### Frontend (my-k3s-app/frontend)
- Установлены: `@tanstack/react-table@^8`, `react-hook-form@^7.56.0`, `zod@^3.24.0`
- Есть хук `useTableCore` в `src/hooks/table/useTableCore.js`
- Есть компонент `GenericTable` в `src/components/table/GenericTable.jsx`
- Админ-панель: `/admin-panel` → страница настроек: `/admin-panel/settings`

---

## Задачи

### Этап 1: Backend - Расширение API для работы с настройками

#### 1.1 Создать сериализатор для настроек Maintenance Mode
**Файл:** `my-k3s-app/backend/users/serializers.py`

Создать `MaintenanceModeSettingsSerializer` с полями:
- `enabled` (Boolean) - включение/выключение режима
- `planned_end_time` (DateTime, optional) - время завершения
- `ips` (List of Strings) - список IP-адресов
- `urls` (List of Strings) - список URL (regex)
- `admin_users` (List of Strings, read-only) - список пользователей с ролью admin

#### 1.2 Создать views для управления настройками
**Файл:** `my-k3s-app/backend/users/views/maintenance.py`

Добавить новые endpoints:
- `GET /api/maintenance/settings/` - получить все настройки
- `PATCH /api/maintenance/settings/` - обновить настройки (кроме admin_users - только чтение)

Примечание: IP-адреса хранятся в settings.py, но для динамического управления лучше перенести в БД (модель MaintenanceMode).

#### 1.3 Изменить модель MaintenanceMode для хранения IPS и URLs
**Файл:** `my-k3s-app/backend/users/models.py`

Добавить поля к модели `MaintenanceMode`:
- `allowed_ips` (JSONField или ArrayField) - список разрешённых IP
- `allowed_urls` (JSONField или ArrayField) - список разрешённых URL (regex)

#### 1.4 Создать миграцию
**Команда:** Создать миграцию для новых полей

```bash
cd my-k3s-app/backend
source venv/bin/activate
python manage.py makemigrations users
python manage.py migrate
```

---

### Этап 2: Frontend - API клиент

#### 2.1 Создать API функции для работы с настройками
**Файл:** `my-k3s-app/frontend/src/api/maintenanceApi.js`

Создать функции:
- `getMaintenanceSettings()` - получить настройки
- `updateMaintenanceSettings(data)` - обновить настройки
- `toggleMaintenanceMode(enabled)` - включить/выключить режим

---

### Этап 3: Frontend - Компоненты страницы настроек

#### 3.1 Обновить маршрутизацию
**Файл:** `my-k3s-app/frontend/src/App.jsx`

Добавить:
- Импорт `SettingsPage` (lazy)
- Маршрут `/admin-panel/settings`

#### 3.2 Обновить AdminPanel для навигации на страницу настроек
**Файл:** `my-k3s-app/frontend/src/pages/AdminPanel.jsx`

Добавить `onClick` на карточку "Настройки системы" для перехода на `/admin-panel/settings`

#### 3.3 Создать Zustand store для настроек
**Файл:** `my-k3s-app/frontend/src/store/useMaintenanceSettingsStore.js`

Zustand: persist() для settings, immer для мутаций; fetchSettings при mount страницы.

Создать store с:
- Состояние: `settings`, `loading`, `error`
- Методы: `fetchSettings()`, `updateSettings()`, `toggleMaintenance()`

#### 3.4 Создать схему валидации Zod
**Файл:** `my-k3s-app/frontend/src/schemas/maintenance.js`

Валидация IP в backend: Zod на фронте + DRF validator (ipaddress.IPv4Address/IPv6Address) для allowed_ips в serializer, чтобы предотвратить invalid данные в БД.

примерная Zod схема: z.array(z.string().ip({ version: 'v4' })), но Zod базово .ip() — IPv4/IPv6; для строгого IPv4 используй regex: z.string().regex(/^(?:(?:25[0-5]|2[0-4][0-9]|
​?[0-9][0-9]?).){3}(?:25[0-5]|2[0-4][0-9]|
​?[0-9][0-9]?)$/).

Создать схему:
```js
export const maintenanceSettingsSchema = z.object({
  enabled: z.boolean(),
  planned_end_time: z.string().datetime().nullable().optional(),
  allowed_ips: z.array(z.string().ip()).default([]),
  allowed_urls: z.array(z.string()).default([]),
});
```

#### 3.5 Создать страницу настроек
**Файл:** `my-k3s-app/frontend/src/pages/SettingsPage.jsx`

Компонент страницы с:
- Секция "Режим обслуживания" (MAINTENANCE_MODE):
  - Toggle переключатель Вкл/Выкл
  - Поле для запланированного времени завершения (опционально)
  
- Секция "Разрешённые IP-адреса" (MAINTENANCE_MODE_IPS):
  - Форма добавления IP (React Hook Form + Zod валидация)
  - Таблица TanStack Table для отображения списка
  - Возможность удаления IP из списка

  TanStack Table: В meta передай функции addRow/removeRow для IpsTable/UrlsTable (local state + optimistic update в store).
  
- Секция "Разрешённые пользователи" (MAINTENANCE_MODE_USERS):
  - Только отображение (read-only)
  - Таблица TanStack Table с колонками: ID, Username, Email, Роль
  
- Секция "Разрешённые URL" (MAINTENANCE_MODE_URLS):
  - Таблица TanStack Table для отображения списка
  - Возможность добавления/удаления URL

#### 3.6 Создать компоненты таблиц для настроек
**Файл:** `my-k3s-app/frontend/src/pages/SettingsPage/components/`

Создать:
- `IpsTable.jsx` - таблица IP-адресов
- `AdminUsersTable.jsx` - таблица пользователей, который могут работать в режиме MAINTENANCE (только чтение)
AdminUsersTable: Отдельный API или в settings response
- `UrlsTable.jsx` - таблица URL

---



### Этап 4: Тестирование

#### 4.1 Тестирование API
- Проверить получение настроек
- Проверить обновление настроек
- Проверить валидацию IP-адресов

#### 4.2 Тестирование Frontend
- Проверить отображение страницы
- Проверить переключение режима обслуживания
- Проверить добавление/удаление IP
- Проверить валидацию Zod

---

## Зависимости между задачами

```
Этап 1 (Backend)
    ↓
Этап 2 (Frontend API)
    ↓
Этап 3 (Frontend Components)
    ↓
Этап 4 (Testing)
```

## Файлы для создания/изменения

### Новые файлы:
- `my-k3s-app/frontend/src/api/maintenanceApi.js`
- `my-k3s-app/frontend/src/store/useMaintenanceSettingsStore.js`
- `my-k3s-app/frontend/src/schemas/maintenance.js`
- `my-k3s-app/frontend/src/pages/SettingsPage.jsx`
- `my-k3s-app/frontend/src/pages/SettingsPage/components/IpsTable.jsx`
- `my-k3s-app/frontend/src/pages/SettingsPage/components/AdminUsersTable.jsx`
- `my-k3s-app/frontend/src/pages/SettingsPage/components/UrlsTable.jsx`

### Файлы для изменения:
- `my-k3s-app/backend/users/models.py` - добавить поля
- `my-k3s-app/backend/users/serializers.py` - добавить serializer
- `my-k3s-app/backend/users/views/maintenance.py` - добавить endpoints
- `my-k3s-app/frontend/src/App.jsx` - добавить маршрут
- `my-k3s-app/frontend/src/pages/AdminPanel.jsx` - добавить навигацию

