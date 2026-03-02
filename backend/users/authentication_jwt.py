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
    Требует наличия sid claim - fail-closed (отклоняем аутентификацию если sid отсутствует).
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
        
        # Fail-closed: если sid отсутствует - отклоняем аутентификацию
        if not sid:
            raise InvalidToken(_('Токен не содержит идентификатор сессии. Войдите в систему заново.'))
        
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
            # Fail-closed: при любой ошибке БД - отклоняем аутентификацию
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Session check error (fail-closed): {e}")
            raise InvalidToken(_('Ошибка проверки сессии. Войдите в систему заново.'))
        
        return (user, validated_token)

