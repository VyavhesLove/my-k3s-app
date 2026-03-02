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
    Проверяет session_uuid из access token против UserSession.
    """
    
    def authenticate(self, request):
        """
        Аутентифицирует запрос с проверкой активности сессии.
        """
        result = super().authenticate(request)
        
        if result is None:
            return None
        
        user, validated_token = result
        
        # Получаем sid (session_uuid) из access token
        sid = validated_token.get('sid')
        
        if sid:
            try:
                from users.models_session import UserSession
                from uuid import UUID
                
                # Конвертируем sid в UUID для запроса
                try:
                    session_uuid = UUID(sid)
                except (ValueError, TypeError):
                    raise InvalidToken(_('Неверный формат идентификатора сессии'))
                
                # Проверяем, есть ли активная сессия с этим session_uuid
                session = UserSession.objects.filter(
                    user=user,
                    session_uuid=session_uuid,
                    is_active=True
                ).first()
                
                if not session:
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

