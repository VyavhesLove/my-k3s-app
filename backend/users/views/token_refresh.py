"""
Кастомный JWT token refresh с проверкой blacklist.
"""
from rest_framework_simplejwt.views import TokenRefreshView
from rest_framework_simplejwt.exceptions import InvalidToken
from rest_framework import status
from rest_framework.response import Response
from django.utils.translation import gettext_lazy as _


class BlacklistTokenRefreshView(TokenRefreshView):
    """
    Кастомный view для refresh токена с проверкой blacklist.
    Сохраняет session_uuid (sid) при обновлении токена.
    """
    
    def post(self, request, *args, **kwargs):
        # Получаем refresh токен из запроса
        refresh_token_str = request.data.get('refresh')
        
        if refresh_token_str:
            # Проверяем blacklist
            try:
                from users.models_session import TokenBlacklist
                
                if TokenBlacklist.is_blacklisted(refresh_token_str):
                    return Response(
                        {'detail': _('Токен был отозван')},
                        status=status.HTTP_401_UNAUTHORIZED
                    )
            except Exception:
                # Продолжаем стандартную обработку при ошибке
                pass
            
            # Пробуем извлечь sid из refresh token
            saved_sid = None
            try:
                from rest_framework_simplejwt.tokens import RefreshToken
                refresh = RefreshToken(refresh_token_str)
                saved_sid = refresh.get('sid')
            except Exception:
                pass
        
        # Выполняем стандартный refresh
        response = super().post(request, *args, **kwargs)
        
        # Если refresh успешен и есть sid - создаём новый access token с тем же sid
        if response.status_code == 200 and saved_sid:
            try:
                from rest_framework_simplejwt.tokens import RefreshToken
                from django.contrib.auth import get_user_model
                
                # Получаем user из refresh token
                refresh = RefreshToken(refresh_token_str)
                user_id = refresh.get('user_id')
                
                if user_id:
                    User = get_user_model()
                    user = User.objects.get(id=user_id)
                    
                    # Создаём новый access token с сохранённым sid
                    from users.views.auth import CustomTokenObtainPairSerializer
                    new_token = CustomTokenObtainPairSerializer.get_token(user)
                    new_token['sid'] = saved_sid
                    
                    # Заменяем access token в ответе
                    response.data['access'] = str(new_token.access_token)
                    
            except Exception as e:
                # Логируем ошибку, но не ломаем refresh (fail-safe)
                import logging
                logger = logging.getLogger(__name__)
                logger.warning(f"Error preserving sid on refresh: {e}")
        
        return response

