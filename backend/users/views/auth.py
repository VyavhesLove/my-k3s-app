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
    """
    serializer_class = CustomTokenObtainPairSerializer

    def post(self, request, *args, **kwargs):
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
            
            return Response(response_data, status=status.HTTP_200_OK)
        
        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )


class SwaggerTokenView(APIView):
    """
    Endpoint для получения JWT токена по username/password.
    Используется для авторизации в Swagger UI.
    Требует, чтобы пользователь имел is_staff=True.
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
        },
        tags=['Auth'],
    )
    def post(self, request):
        User = get_user_model()
        username = request.data.get('username')
        password = request.data.get('password')
        
        if not username or not password:
            return Response(
                {'error': 'Требуются username и password'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Проверяем пользователя
        try:
            user = User.objects.get(username=username)
        except User.DoesNotExist:
            return Response(
                {'error': 'Неверные учетные данные'},
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        # Проверяем is_staff
        if not user.is_staff:
            return Response(
                {'error': 'Доступ только для staff пользователей'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Проверяем active
        if not user.active:
            return Response(
                {'error': 'Пользователь заблокирован'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Проверяем пароль
        if not user.check_password(password):
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
            
            # Форматируем ответ для Swagger UI (ожидает access_token, а не access)
            return Response({
                'access_token': serializer.validated_data.get('access'),
                'token_type': 'Bearer',
                'expires_in': 3600,  # 60 минут (в секундах)
                'refresh_token': serializer.validated_data.get('refresh'),
            })
        
        return Response(
            {'error': 'Неверные учетные данные'},
            status=status.HTTP_401_UNAUTHORIZED
        )

