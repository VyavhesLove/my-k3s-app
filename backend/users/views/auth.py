"""Аутентификация и работа с токенами."""
import uuid
from rest_framework import serializers
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model
from django.utils import timezone
from drf_spectacular.utils import extend_schema

# Импорт модели UserSession для создания сессий при логине
from users.models_session import UserSession
# Импорт модели LoginLog для логирования входов
from users.models import LoginLog, LoginErrorStatus
# Импорт сервиса блокировки при неверном пароле
from users.services import LoginLockService


def get_client_ip(request):
    """
    Получает IP адрес клиента из запроса.
    Использует X-Forwarded-For (список IP, первый - оригинальный).
    """
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        return x_forwarded_for.split(',')[0].strip()
    return request.META.get('REMOTE_ADDR')


def get_user_agent(request):
    """Получает User-Agent из запроса."""
    return request.META.get('HTTP_USER_AGENT', '')[:255]


def log_login(request, username, success, error_status=None, user=None):
    """Логирует попытку входа."""
    client_ip = get_client_ip(request)
    
    LoginLog.objects.create(
        username=username,
        user=user,
        success=success,
        error_status=error_status,
        ip_address=client_ip,
        user_agent=get_user_agent(request)
    )


class SwaggerTokenRequestSerializer(serializers.Serializer):
    """Сериализатор для запроса токена Swagger."""
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)


class SwaggerTokenResponseSerializer(serializers.Serializer):
    """Сериализатор для ответа токена Swagger."""
    access_token = serializers.CharField()
    token_type = serializers.CharField()
    expires_in = serializers.IntegerField()
    refresh_token = serializers.CharField()


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """
    Кастомный сериализатор для получения токена.
    Проверяет, что пользователь активен (active).
    Возвращает корректное сообщение "Пользователь заблокирован" вместо стандартного
    "Invalid username or password" если пользователь неактивен.
    Также добавляет sid (session_uuid) в access token.
    """
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        
        # Создаём session_uuid для нового токена
        session_uuid = uuid.uuid4()
        
        # Добавляем sid в access token
        token['sid'] = str(session_uuid)
        
        # Сохраняем session_uuid для использования при создании UserSession
        token._session_uuid = session_uuid
        
        return token
    
    def validate(self, attrs):
        User = get_user_model()
        username = attrs.get('username')
        
        # Если есть username - проверяем пользователя
        if username:
            try:
                user = User.objects.get(username=username)
                # Проверяем active перед аутентификацией
                if not user.active:
                    raise serializers.ValidationError({
                        'non_field_errors': ['Пользователь заблокирован']
                    })
            except User.DoesNotExist:
                # Если пользователя не существует - пропускаем
                pass
        
        # Вызываем стандартную валидацию (которая сгенерирует токен)
        return super().validate(attrs)


def create_user_session(user, token_id, request, session_uuid=None):
    """
    Создаёт запись о сессии пользователя.
    Вызывается при успешной аутентификации.
    """
    # Получаем IP адрес из заголовков или REMOTE_ADDR
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip_address = x_forwarded_for.split(',')[0].strip()
    else:
        ip_address = request.META.get('REMOTE_ADDR')
    
    # Получаем User-Agent
    user_agent = request.META.get('HTTP_USER_AGENT', '')[:255]
    
    # Определяем описание на основе User-Agent
    description = 'Основной браузер'
    if user_agent:
        if 'Mobile' in user_agent or 'Android' in user_agent:
            description = 'Мобильное устройство'
        elif 'iPhone' in user_agent:
            description = 'iPhone'
        elif 'iPad' in user_agent:
            description = 'iPad'
    
    # Делаем все предыдущие сессии неактивными при новом входе
    UserSession.objects.filter(user=user, is_active=True).update(is_active=False)
    
    # Используем session_uuid из параметра или создаём новый
    if session_uuid is None:
        import uuid as uuid_module
        session_uuid = uuid_module.uuid4()
    
    # Создаём новую сессию с session_uuid
    session = UserSession.objects.create(
        user=user,
        session_uuid=session_uuid,
        token_id=token_id,
        user_agent=user_agent,
        ip_address=ip_address,
        description=description,
        is_active=True,
    )


class CustomTokenObtainPairView(TokenObtainPairView):
    """
    Кастомное представление для получения токена.
    Проверяет active перед выдачей токена.
    Создаёт запись о сессии при успешной аутентификации.
    Блокирует пользователя при 3+ неудачных попытках входа.
    """
    serializer_class = CustomTokenObtainPairSerializer

    def post(self, request, *args, **kwargs):
        username = request.data.get('username', '')
        client_ip = get_client_ip(request)
        
        # Проверяем, не забанен ли пользователь по IP
        if LoginLockService.is_banned(username, client_ip):
            remaining = LoginLockService.get_remaining_seconds(username, client_ip)
            minutes = remaining // 60
            seconds = remaining % 60
            
            # Логируем попытку входа при бане
            log_login(
                request, 
                username, 
                success=False, 
                error_status=LoginErrorStatus.BANNED
            )
            
            return Response(
                {
                    'error': f'Превышено количество попыток входа. Попробуйте через {minutes} мин {seconds} сек'
                },
                status=status.HTTP_429_TOO_MANY_REQUESTS
            )
        
        serializer = self.get_serializer(data=request.data)
        
        if serializer.is_valid():
            user = serializer.user
            
            # Создаём токены вручную из user (это правильный способ в simplejwt)
            token = CustomTokenObtainPairSerializer.get_token(user)
            session_uuid = getattr(token, '_session_uuid', None)
            
            # Генерируем refresh token из того же user
            refresh = RefreshToken.for_user(user)
            
            # Копируем sid в refresh token тоже
            if session_uuid:
                refresh['sid'] = str(session_uuid)
            
            # Формируем ответ
            response_data = {
                'access': str(token.access_token),
                'refresh': str(refresh),
            }
            
            # Создаём сессию с правильным sid
            if session_uuid:
                create_user_session(user, str(refresh), request, session_uuid)
            
            # Очищаем счётчик попыток при успешном входе
            LoginLockService.clear_attempts(username, client_ip)
            
            # Логируем успешный вход
            log_login(request, username, success=True, user=user)
            
            return Response(response_data, status=status.HTTP_200_OK)
        
        # Логируем неудачную попытку входа
        # Пытаемся определить причину ошибки
        errors = serializer.errors
        error_status = LoginErrorStatus.UNKNOWN
        
        if 'non_field_errors' in errors:
            error_messages = str(errors['non_field_errors'])
            if 'заблокирован' in error_messages.lower():
                error_status = LoginErrorStatus.USER_BLOCKED
            elif 'неверный' in error_messages.lower() or 'invalid' in error_messages.lower():
                error_status = LoginErrorStatus.INVALID_PASSWORD
        
        # Инкрементируем счётчик попыток при неудаче
        attempts = LoginLockService.increment_attempts(username, client_ip)
        
        # Если после инкремента достигли лимита - логируем как бан
        if attempts >= LoginLockService.MAX_ATTEMPTS:
            error_status = LoginErrorStatus.BANNED
            log_login(request, username, success=False, error_status=error_status)
            remaining = LoginLockService.get_remaining_seconds(username, client_ip)
            minutes = remaining // 60
            seconds = remaining % 60
            return Response(
                {
                    'error': f'Превышено количество попыток входа. Попробуйте через {minutes} мин {seconds} сек'
                },
                status=status.HTTP_429_TOO_MANY_REQUESTS
            )
        
        log_login(request, username, success=False, error_status=error_status)
        
        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )


class SwaggerTokenView(APIView):
    """
    Endpoint для получения JWT токена по username/password.
    Используется для авторизации в Swagger UI.
    Требует, чтобы пользователь имел is_staff=True.
    Блокирует пользователя при 3+ неудачных попытках входа.
    """
    authentication_classes = []  # Без аутентификации
    permission_classes = []  # Без разрешений
    
    @extend_schema(
        summary="Получение токена для Swagger",
        description="Получает JWT токен по username/password. "
                   "Используется для авторизации в Swagger UI. "
                   "Требует, чтобы пользователь имел is_staff=True.",
        request=SwaggerTokenRequestSerializer,
        responses={
            200: SwaggerTokenResponseSerializer,
            400: {'description': 'Требуются username и password'},
            401: {'description': 'Неверные учетные данные'},
            403: {'description': 'Доступ только для staff пользователей или пользователь заблокирован'},
            429: {'description': 'Превышено количество попыток входа'},
        },
        tags=['Auth'],
    )
    def post(self, request):
        User = get_user_model()
        username = request.data.get('username')
        password = request.data.get('password')
        client_ip = get_client_ip(request)
        
        if not username or not password:
            return Response(
                {'error': 'Требуются username и password'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Проверяем, не забанен ли пользователь по IP
        if LoginLockService.is_banned(username, client_ip):
            remaining = LoginLockService.get_remaining_seconds(username, client_ip)
            minutes = remaining // 60
            seconds = remaining % 60
            
            # Логируем попытку входа при бане
            log_login(
                request, 
                username, 
                success=False, 
                error_status=LoginErrorStatus.BANNED
            )
            
            return Response(
                {
                    'error': f'Превышено количество попыток входа. Попробуйте через {minutes} мин {seconds} сек'
                },
                status=status.HTTP_429_TOO_MANY_REQUESTS
            )
        
        # Проверяем пользователя
        try:
            user = User.objects.get(username=username)
        except User.DoesNotExist:
            # Логируем неудачную попытку - неверный логин
            # Инкрементируем счётчик попыток
            attempts = LoginLockService.increment_attempts(username, client_ip)
            
            # Если после инкремента достигли лимита
            if attempts >= LoginLockService.MAX_ATTEMPTS:
                log_login(request, username, success=False, error_status=LoginErrorStatus.BANNED)
                remaining = LoginLockService.get_remaining_seconds(username, client_ip)
                minutes = remaining // 60
                seconds = remaining % 60
                return Response(
                    {
                        'error': f'Превышено количество попыток входа. Попробуйте через {minutes} мин {seconds} сек'
                    },
                    status=status.HTTP_429_TOO_MANY_REQUESTS
                )
            
            log_login(request, username, success=False, error_status=LoginErrorStatus.INVALID_USERNAME)
            return Response(
                {'error': 'Неверные учетные данные'},
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        # Проверяем is_staff
        if not user.is_staff:
            # Логируем неудачную попытку - недостаточно прав
            # Инкрементируем счётчик попыток
            attempts = LoginLockService.increment_attempts(username, client_ip)
            
            # Если после инкремента достигли лимита
            if attempts >= LoginLockService.MAX_ATTEMPTS:
                log_login(request, username, success=False, error_status=LoginErrorStatus.BANNED)
                remaining = LoginLockService.get_remaining_seconds(username, client_ip)
                minutes = remaining // 60
                seconds = remaining % 60
                return Response(
                    {
                        'error': f'Превышено количество попыток входа. Попробуйте через {minutes} мин {seconds} сек'
                    },
                    status=status.HTTP_429_TOO_MANY_REQUESTS
                )
            
            log_login(request, username, success=False, error_status=LoginErrorStatus.UNKNOWN)
            return Response(
                {'error': 'Доступ только для staff пользователей'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Проверяем active
        if not user.active:
            # Логируем неудачную попытку - пользователь заблокирован
            # Инкрементируем счётчик попыток
            attempts = LoginLockService.increment_attempts(username, client_ip)
            
            # Если после инкремента достигли лимита
            if attempts >= LoginLockService.MAX_ATTEMPTS:
                log_login(request, username, success=False, error_status=LoginErrorStatus.BANNED, user=user)
                remaining = LoginLockService.get_remaining_seconds(username, client_ip)
                minutes = remaining // 60
                seconds = remaining % 60
                return Response(
                    {
                        'error': f'Превышено количество попыток входа. Попробуйте через {minutes} мин {seconds} сек'
                    },
                    status=status.HTTP_429_TOO_MANY_REQUESTS
                )
            
            log_login(request, username, success=False, error_status=LoginErrorStatus.USER_BLOCKED, user=user)
            return Response(
                {'error': 'Пользователь заблокирован'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Проверяем пароль
        if not user.check_password(password):
            # Логируем неудачную попытку - неверный пароль
            # Инкрементируем счётчик попыток
            attempts = LoginLockService.increment_attempts(username, client_ip)
            
            # Если после инкремента достигли лимита
            if attempts >= LoginLockService.MAX_ATTEMPTS:
                log_login(request, username, success=False, error_status=LoginErrorStatus.BANNED, user=user)
                remaining = LoginLockService.get_remaining_seconds(username, client_ip)
                minutes = remaining // 60
                seconds = remaining % 60
                return Response(
                    {
                        'error': f'Превышено количество попыток входа. Попробуйте через {minutes} мин {seconds} сек'
                    },
                    status=status.HTTP_429_TOO_MANY_REQUESTS
                )
            
            log_login(request, username, success=False, error_status=LoginErrorStatus.INVALID_PASSWORD, user=user)
            return Response(
                {'error': 'Неверные учетные данные'},
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        # Генерируем токены через тот же метод, что и стандартный endpoint
        # Используем TokenObtainPairSerializer для согласованности
        serializer = CustomTokenObtainPairSerializer(data={
            'username': username,
            'password': password
        })
        
        if serializer.is_valid():
            # Создаём токены вручную из user (это правильный способ в simplejwt)
            user = serializer.user
            token = CustomTokenObtainPairSerializer.get_token(user)
            session_uuid = getattr(token, '_session_uuid', None)
            
            # Получаем refresh token из validated_data
            refresh_token = serializer.validated_data.get('refresh')
            
            # Создаём сессию при успешной аутентификации
            if refresh_token and session_uuid:
                token_id = str(refresh_token)
                create_user_session(user, token_id, request, session_uuid)
            
            # Очищаем счётчик попыток при успешном входе
            LoginLockService.clear_attempts(username, client_ip)
            
            # Логируем успешный вход
            log_login(request, username, success=True, user=user)
            
            # Форматируем ответ для Swagger UI (ожидает access_token, а не access)
            return Response({
                'access_token': serializer.validated_data.get('access'),
                'token_type': 'Bearer',
                'expires_in': 3600,  # 60 минут (в секундах)
                'refresh_token': serializer.validated_data.get('refresh'),
            })
        
        # Логируем неудачную попытку входа (неизвестная ошибка)
        # Инкрементируем счётчик попыток
        attempts = LoginLockService.increment_attempts(username, client_ip)
        
        # Если после инкремента достигли лимита
        if attempts >= LoginLockService.MAX_ATTEMPTS:
            log_login(request, username, success=False, error_status=LoginErrorStatus.BANNED, user=user)
            remaining = LoginLockService.get_remaining_seconds(username, client_ip)
            minutes = remaining // 60
            seconds = remaining % 60
            return Response(
                {
                    'error': f'Превышено количество попыток входа. Попробуйте через {minutes} мин {seconds} сек'
                },
                status=status.HTTP_429_TOO_MANY_REQUESTS
            )
        
        log_login(request, username, success=False, error_status=LoginErrorStatus.UNKNOWN, user=user)
        
        return Response(
            {'error': 'Неверные учетные данные'},
            status=status.HTTP_401_UNAUTHORIZED
        )

