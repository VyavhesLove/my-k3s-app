from django.contrib.auth.backends import ModelBackend
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import AuthenticationFailed
from rest_framework import authentication, exceptions

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


class SessionAwareJWTAuthentication(JWTAuthentication):
    """
    Кастомный JWT аутентификатор, который проверяет активность сессии.
    Требует заголовок X-Session-ID с token_id для проверки.
    """
    
    def authenticate(self, request):
        # Получаем результат стандартной аутентификации
        result = super().authenticate(request)
        
        if result is None:
            return None
        
        user, validated_token = result
        
        # Получаем token_id из заголовка
        token_id = request.headers.get('X-Session-ID')
        
        if token_id:
            # Проверяем активность сессии
            from users.models_session import UserSession
            
            try:
                session = UserSession.objects.get(
                    user=user,
                    token_id=token_id,
                    is_active=True
                )
                # Обновляем last_activity
                session.save(update_fields=['last_activity'])
            except UserSession.DoesNotExist:
                raise AuthenticationFailed('Сессия завершена. Пожалуйста, войдите снова.')
        
        return (user, validated_token)

