# TODO - Реализация безопасного принудительного завершения сессий ✅ ЗАВЕРШЕНО

## Выполненные изменения

### Этап 1: Backend - Модель Session (models_session.py) ✅
- [x] 1.1 Добавить поле `session_uuid = models.UUIDField(unique=True, default=uuid4, db_index=True)` в модель UserSession
- [x] 1.2 Обновить метод `__str__` для отображения session_uuid

### Этап 2: Backend - Создание сессии при логине (views/auth.py) ✅
- [x] 2.1 Импортировать `uuid` из Python стандартной библиотеки
- [x] 2.2 Обновить функцию `create_user_session` для генерации и сохранения `session_uuid`
- [x] 2.3 Обновить сериализатор `CustomTokenObtainPairSerializer` для добавления `sid` claim в access token
- [x] 2.4 Обновить `CustomTokenObtainPairView` для передачи session_uuid при создании сессии
- [x] 2.5 Обновить `SwaggerTokenView` для использования session_uuid

### Этап 3: Backend - Аутентификация (authentication_jwt.py) ✅
- [x] 3.1 Убрать проверку `request.headers['X-Session-ID']`
- [x] 3.2 Читать `sid` из validated token
- [x] 3.3 Проверять `UserSession.is_active` по `session_uuid`

### Этап 4: Backend - Refresh токена (views/token_refresh.py) ✅
- [x] 4.1 Обновить refresh для сохранения того же `session_uuid` в новом access token

### Этап 5: Frontend - LoginPage ✅
- [x] 5.1 Убрать сохранение refresh как `sessionId`

### Этап 6: Frontend - axios.js ✅
- [x] 6.1 Убрать отправку `X-Session-ID` заголовка
- [x] 6.2 Обновить обработку 401 для сообщения "сессия завершена"

### Этап 7: Frontend - Sidebar ✅
- [x] 7.1 Убрать использование sessionId из handleLogout

### Этап 8: Зависимости ✅
- [x] 8.1 Добавить PyJWT в requirements.txt

### Этап 9: Миграция ✅
- [x] 9.1 Создана миграция `0006_usersession_session_uuid.py`

## Критерии готовности ✅
- [x] Пользователь с завершённой админом сессией получает 401 на следующем запросе
- [x] Refresh token не уходит в кастомные заголовки и не хранится как sessionId
- [x] Все тесты проходят успешно

## Изменённые файлы

### Backend
- `backend/users/models_session.py` - добавлено поле session_uuid
- `backend/users/views/auth.py` - добавлен sid в token, обновлена логика создания сессии
- `backend/users/authentication_jwt.py` - проверка сессии по sid из token
- `backend/users/views/token_refresh.py` - сохранение sid при refresh
- `backend/requirements.txt` - добавлен PyJWT
- `backend/users/migrations/0006_usersession_session_uuid.py` - миграция

### Frontend
- `frontend/src/components/LoginPage.jsx` - убрано сохранение sessionId
- `frontend/src/api/axios.js` - убран X-Session-ID заголовок
- `frontend/src/components/sidebar/Sidebar.jsx` - убрано использование sessionId

## Следующие шаги (выполнить вручную)

После деплоя необходимо:
1. Применить миграцию: `python manage.py migrate`
2. Убедиться, что пользователи логинятся заново для создания сессий с session_uuid

