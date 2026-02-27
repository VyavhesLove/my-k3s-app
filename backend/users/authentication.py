from django.contrib.auth.backends import ModelBackend
from django.contrib.auth import get_user_model

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

