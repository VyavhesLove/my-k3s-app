"""Аутентификация и работа с токенами."""
from rest_framework import serializers
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth import get_user_model
from django.utils import timezone

# Импорт модели UserSession для создания сессий при логине
from users.models_session import UserSession


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """
    Кастомный сериализатор для получения токена.
    Проверяет, что пользователь активен (active).
    Возвращает корректное сообщение "Пользователь заблокирован" вместо стандартного
    "Invalid username or password" если пользователь неактивен.
    """
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


def create_user_session(user, token_id, request):
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
    
    # Используем update_or_create для избежания ошибки уникальности
    # Если сессия с таким token_id уже существует (но была неактивна) - обновляем её
    session, created = UserSession.objects.update_or_create(
        user=user,
        token_id=token_id,
        defaults={
            'user_agent': user_agent,
            'ip_address': ip_address,
            'description': description,
            'is_active': True,
        }
    )


class CustomTokenObtainPairView(TokenObtainPairView):
    """
    Кастомное представление для получения токена.
    Проверяет active перед выдачей токена.
    Создаёт запись о сессии при успешной аутентификации.
    """
    serializer_class = CustomTokenObtainPairSerializer

    def post(self, request, *args, **kwargs):
        # Получаем стандартный ответ
        response = super().post(request, *args, **kwargs)
        
        # Если аутентификация успешна - создаём сессию
        if response.status_code == 200:
            User = get_user_model()
            username = request.data.get('username')
            
            if username:
                try:
                    user = User.objects.get(username=username)
                    
                    # Получаем refresh токен из ответа
                    refresh_token = response.data.get('refresh')
                    
                    if refresh_token:
                        # Используем первые 8 символов refresh токена как token_id
                        token_id = refresh_token[:8]
                        create_user_session(user, token_id, request)
                        
                except User.DoesNotExist:
                    pass
        
        return response

