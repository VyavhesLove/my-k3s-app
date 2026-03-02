"""
Кастомный JWT аутентификатор с проверкой активных сессий.
"""
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken, AuthenticationFailed
from django.utils.translation import gettext_lazy as _


class BlacklistJWTAuthentication(JWTAuthentication):
    """
    Кастомный JWT аутентификатор, который проверяет активность сессии пользователя.
    Если сессия пользователя завершена (is_active=False), аутентификация не пройдёт.
    """
    
    def authenticate(self, request):
        """
        Аутентифицирует запрос с проверкой активности сессии.
        """
        result = super().authenticate(request)
        
        if result is None:
            return None
        
        user, validated_token = result
        
        # Получаем token_id из заголовка X-Session-ID
        token_id = request.headers.get('X-Session-ID')
        
        if token_id:
            try:
                from users.models_session import UserSession
                
                # Проверяем, есть ли активная сессия с этим token_id
                session_exists = UserSession.objects.filter(
                    user=user,
                    token_id=token_id,
                    is_active=True
                ).exists()
                
                if not session_exists:
                    # Сессия неактивна или не существует - отклоняем аутентификацию
                    raise InvalidToken(_('Сессия завершена. Войдите в систему заново.'))
                    
            except InvalidToken:
                raise
            except Exception as e:
                # Логируем ошибку, но не блокируем аутентификацию
                import logging
                logger = logging.getLogger(__name__)
                logger.warning(f"Error checking session: {e}")
        
        return (user, validated_token)

