# TODO: Создание схемы логирования входов

## Шаги выполнения

- [x] 1. Создать модель LoginLog в users/models.py
- [x] 2. Добавить LoginLog в админку users/admin.py
- [x] 3. Добавить логирование в users/views/auth.py
- [x] 4. Создать миграции:
  - users/migrations/0002_loginlog.py
  - users/migrations/0003_loginlog_ip_debug.py
- [ ] 5. Применить миграции: python manage.py migrate

## Что сделано для IP-адреса

1. **Функция get_client_ip** - использует X-Forwarded-For (берёт первый IP из списка)
2. **Поле ip_debug** - записывает все источники IP для отладки:
   - util - (результат get_client_ip)
   - X-Real-IP
   - X-Forwarded-For
   - REMOTE_ADDR
3. **nginx.conf** - добавлены заголовки X-Forwarded-For и X-Forwarded-Proto
4. **ingress.yaml** - добавлены аннотации:
   - nginx.ingress.kubernetes.io/use-forwarded-headers: "true"
   - nginx.ingress.kubernetes.io/forwarded-for-header: "X-Forwarded-For"



