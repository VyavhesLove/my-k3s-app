# TODO: Реализация бана при неверном пароле (3 попытки)

## Анализ задачи

**Требования заказчика:**
1. Хранить счётчик попыток входа по ключу: `login_attempts:{username}:{ip}`
2. TTL (время жизни ключа) - 5 минут (300 секунд)
3. Инкрементировать счётчик при неудаче:
   - Если первая попытка → установить TTL 300 секунд
   - Если счётчик ≥ 3 → возвращать 429 и писать в лог "temporary lock"
4. При успешном входе - удалять ключ
5. Писать в логи входов в поле error_status = "banned_on_5min"

## Текущее состояние проекта

- Redis уже настроен в `settings.py` (REDIS_URL, CACHES)
- Модель LoginLog уже существует в `users/models.py`
- Логирование входов уже реализовано в `users/views/auth.py`
- Функция `get_client_ip()` уже есть

---

## План реализации

### Этап 1: Создание сервиса для работы с Redis-баном ✅

- [x] **1.1** Создать файл `users/services/__init__.py` (если не существует)
- [x] **1.2** Создать `users/services/login_lock_service.py` с классом `LoginLockService`:
  - Метод `get_attempts_key(username, ip)` - формирует ключ
  - Метод `increment_attempts(username, ip)` - инкрементирует счётчик, устанавливает TTL при первой попытке
  - Метод `is_banned(username, ip)` - проверяет, забанен ли пользователь (счётчик >= 3)
  - Метод `clear_attempts(username, ip)` - удаляет ключ при успешном входе
  - Метод `get_remaining_seconds(username, ip)` - возвращает оставшееся время бана

### Этап 2: Модификация LoginLog для нового статуса ошибки ✅

- [x] **2.1** Добавить новый статус `BANNED = "banned_on_5min"` в `LoginErrorStatus` (users/models.py)
- [x] **2.2** Проверить что поле error_status имеет достаточную длину для нового статуса

### Этап 3: Интеграция с authentication views ✅

- [x] **3.1** Импортировать `LoginLockService` в `users/views/auth.py`
- [x] **3.2** Модифицировать `CustomTokenObtainPairView.post()`:
  - В начале метода (до валидации) проверять `LoginLockService.is_banned()`
  - Если забанен - возвращать 429 Too Many Requests с сообщением
  - При неудачной попытке (неверный пароль) вызывать `LoginLockService.increment_attempts()`
  - При успешном входе вызывать `LoginLockService.clear_attempts()`
  - При бане записывать в лог error_status = BANNED
- [x] **3.3** Аналогично модифицировать `SwaggerTokenView.post()`

### Этап 4: Frontend - страница TooManyRequestsPage ✅

- [x] **4.1** Проверить существование `frontend/src/pages/TooManyRequestsPage.jsx` - создано
- [x] **4.2** Создать `TooManyRequestsPage.jsx`
- [x] **4.3** Добавить экспорт в `frontend/src/pages/index.js`
- [x] **4.4** Настроить routing для 429 ошибки в `App.jsx`
- [x] **4.5** Добавить обработку 429 в axios interceptor
- [x] **4.6** Добавить обработку 429 в LoginPage

### Этап 5: Тестирование

- [ ] **5.1** Запустить тесты: `cd backend && source venv/bin/activate && pytest`
- [ ] **5.2** Протестировать вручную сценарии:
  - 3 неудачных попытки → бан на 5 минут
  - 4-я попытка при бане → 429
  - Успешный вход → счётчик сбрасывается
  - Истечение TTL → бан снимается

---

## Файлы для редактирования/создания

### Новые файлы:
1. ✅ `backend/users/services/__init__.py` - создано
2. ✅ `backend/users/services/login_lock_service.py` - создано
3. ✅ `frontend/src/pages/TooManyRequestsPage.jsx` - создано

### Редактируемые файлы:
1. ✅ `backend/users/models.py` - добавлен статус BANNED
2. ✅ `backend/users/views/auth.py` - добавлена логика бана
3. ✅ `frontend/src/pages/index.js` - добавлен экспорт TooManyRequestsPage
4. ✅ `frontend/src/App.jsx` - добавлен маршрут /429
5. ✅ `frontend/src/api/axios.js` - добавлен interceptor для 429
6. ✅ `frontend/src/components/LoginPage.jsx` - добавлена обработка 429

---

## Технические детали

### Формат ключа Redis:
```
login_attempts:{username}:{ip}
```

### Логика работы:

```python
# При неудачном входе:
key = f"login_attempts:{username}:{ip}"
current = redis.get(key) or 0
if current == 0:
    # Первая попытка - устанавливаем TTL
    redis.setex(key, 300, 1)
else:
    # Последующие попытки
    redis.incr(key)

# Проверка бана:
if int(redis.get(key) or 0) >= 3:
    return 429, {"error": "Превышено количество попыток. Попробуйте через N минут"}

# При успешном входе:
redis.delete(key)
```

---

## Зависимости

- Python: redis (уже есть в requirements.txt)
- Django: от 3.x
- Redis сервер: уже развернут в k8s

---

## Запуск тестов после реализации

```bash
cd /home/pvn/my-k3s-app/backend
source venv/bin/activate
pytest
```

