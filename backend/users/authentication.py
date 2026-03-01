from django.contrib.auth.backends import ModelBackend
from django.contrib.auth import get_user_model
from rest_framework import authentication
from rest_framework.exceptions import AuthenticationFailed

User = get_user_model()


class CustomAuthenticationBackend(ModelBackend):
    """
    Кастомный бэкенд аутентификации.
    Проверяет кастомное поле 'active' вместо стандартного 'is_active'.
    """
    def authenticate(self, request, username=None, password=None, **kwargs):
        if username is None or password is None:
            return None
        
        try:
            user = User.objects.get(username=username)
        except User.DoesNotExist:
            # Запускаем хеширование, чтобы нельзя было опредеть существует ли пользователь
            User().set_password(password)
            return None
        
        # Проверяем кастомное поле active, а не is_active
        if not user.active:
            return None
        
        # Проверяем пароль
        if user.check_password(password) and self.user_can_authenticate(user):
            return user
        
        return None
    
    def user_can_authenticate(self, user):
        """
        Проверяет, может ли пользователь пройти аутентификацию.
        Используем кастомное поле 'active'.
        """
        is_active = getattr(user, 'active', None)
        return is_active or is_active is None


class StaffUserPasswordAuthentication(authentication.BaseAuthentication):
    """
    Кастомная аутентификация для Swagger UI.
    Принимает username/password и проверяет, что пользователь is_staff.
    """
    def authenticate(self, request):
        """
        Аутентифицирует запрос на основе заголовков Authorization.
        Ожидается формат: Authorization: Basic base64(username:password)
        """
        auth_header = request.META.get('HTTP_AUTHORIZATION', '')
        
        if not auth_header.startswith('Basic '):
            return None
        
        try:
            import base64
            # Декодируем base64
            encoded_credentials = auth_header[6:]  # Убираем 'Basic '
            decoded_bytes = base64.b64decode(encoded_credentials)
            decoded_string = decoded_bytes.decode('utf-8')
            username, password = decoded_string.split(':', 1)
        except Exception:
            return None
        
        # Аутентифицируем пользователя
        try:
            user = User.objects.get(username=username)
        except User.DoesNotExist:
            raise AuthenticationFailed('Неверные учетные данные')
        
        # Проверяем кастомное поле active
        if not user.active:
            raise AuthenticationFailed('Пользователь неактивен')
        
        # Проверяем пароль
        if not user.check_password(password):
            raise AuthenticationFailed('Неверные учетные данные')
        
        # Проверяем is_staff
        if not user.is_staff:
            raise AuthenticationFailed('Доступ только для staff')
        
        # Проверяем, что пользователь может аутентифицироваться
        if not self.user_can_authenticate(user):
            raise AuthenticationFailed('Пользователь не может войти')
        
        return (user, None)
    
    def user_can_authenticate(self, user):
        """Проверяет, может ли пользователь пройти аутентификацию."""
        is_active = getattr(user, 'active', None)
        return is_active or is_active is None
    
    def authenticate_header(self, request):
        """
        Возвращает строку, которая будет использоваться в заголовке
        WWW-Authenticate для запроса аутентификации.
        """
        return 'Basic realm="api"'

