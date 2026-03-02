# Предложение: безопасное принудительное завершение сессий

## Что исправляем

1. Убираем зависимость от `X-Session-ID` как обязательного источника истины.
2. Перестаём передавать refresh token в заголовках/каждом запросе.
3. Делаем инвалидирование сессии серверным и проверяемым на каждом API-запросе.

## Целевая схема

### 1) Login
- При логине бэкенд создаёт `UserSession` с `session_uuid` (случайный UUID, не refresh).
- В access token добавляется claim `sid=session_uuid`.
- Refresh token остаётся только для обновления токена и не уходит в кастомные заголовки.

### 2) Проверка доступа (каждый запрос)
- `JWTAuthentication` после валидации access читает `sid` из validated token.
- Ищет `UserSession(user=request.user, session_uuid=sid, is_active=True)`.
- Если не найдено — 401 + сообщение о завершённой сессии.

### 3) Terminate from admin
- Админ выключает `is_active=False` у нужной сессии.
- Этого достаточно для немедленного “выкидывания”: следующий API-запрос пользователя получает 401.
- Дополнительно можно блэклистить refresh через стандартный simplejwt blacklist (или текущую таблицу), чтобы нельзя было обновиться после кика.

## Минимальные изменения по коду

### Backend
- `users/models_session.py`
  - добавить поле `session_uuid = models.UUIDField(unique=True, default=uuid4, db_index=True)`.
  - оставить `token_id` только для обратной совместимости/миграции, затем удалить.

- `users/views/auth.py` (или где `CustomTokenObtainPairView`/serializer)
  - при выдаче пары токенов создавать/актуализировать `UserSession`.
  - писать `sid` в access token claim.

- `users/authentication_jwt.py`
  - убрать проверку по `request.headers['X-Session-ID']`.
  - валидировать только `sid` из access token против `UserSession.is_active`.

- `users/views/token_refresh.py`
  - при refresh новый access должен наследовать тот же `sid` (или переиздать с тем же sid).
  - если refresh в blacklist/невалиден — 401.

### Frontend
- `LoginPage.jsx`
  - не сохранять refresh в `sessionId`.

- `api/axios.js`
  - удалить отправку `X-Session-ID`.
  - оставить стандартную схему: Bearer access + refresh при 401.
  - при ответе “сессия завершена” чистить storage и редиректить на `/login`.

## Миграция и совместимость

1. Добавить `session_uuid` nullable.
2. Бэкфилл для активных `UserSession`.
3. Переключить аутентификацию на `sid`.
4. Удалить использование `X-Session-ID` на фронте.
5. После стабилизации удалить `token_id` или оставить как служебное поле без передачи клиенту.

## Критерии готовности

- Пользователь с завершённой админом сессией получает 401 на следующем запросе даже если вручную удалил любые кастомные заголовки.
- Refresh token не уходит в кастомные заголовки и не хранится как `sessionId`.
- В репозитории отсутствуют `__pycache__`/`.pyc` артефакты.
