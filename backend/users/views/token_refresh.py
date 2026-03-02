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
        refresh_token = request.data.get('refresh')
        
        if refresh_token:
            try:
                from users.models_session import TokenBlacklist
                
                if TokenBlacklist.is_blacklisted(refresh_token):
                    return Response(
                        {'detail': _('Токен был отозван')},
                        status=status.HTTP_401_UNAUTHORIZED
                    )
            except Exception:
                # Продолжаем стандартную обработку при ошибке
                pass
        
        # Получаем текущий access token для извлечения sid
        auth_header = request.headers.get('Authorization', '')
        old_access_token = None
        
        if auth_header.startswith('Bearer '):
            old_access_token = auth_header[7:]
        
        # Выполняем стандартный refresh
        response = super().post(request, *args, **kwargs)
        
        # Если refresh успешен, нужно сохранить sid в новом access token
        if response.status_code == 200 and old_access_token:
            try:
                from rest_framework_simplejwt.token_blacklist.models import OutstandingToken
                from rest_framework_simplejwt.tokens import RefreshToken
                from django.contrib.auth import get_user_model
                import jwt
                from django.conf import settings
                
                # Декодируем старый access token для получения sid
                try:
                    old_payload = jwt.decode(
                        old_access_token,
                        settings.SECRET_KEY,
                        algorithms=['HS256']
                    )
                    old_sid = old_payload.get('sid')
                    
                    if old_sid:
                        # Получаем user из refresh token
                        refresh = RefreshToken(refresh_token)
                        user_id = refresh.get('user_id')
                        
                        if user_id:
                            User = get_user_model()
                            try:
                                user = User.objects.get(id=user_id)
                                
                                # Создаём новый access token с тем же sid
                                from users.views.auth import CustomTokenObtainPairSerializer
                                serializer = CustomTokenObtainPairSerializer()
                                token = serializer.get_token(user)
                                
                                # Устанавливаем тот же sid
                                token['sid'] = old_sid
                                
                                # Заменяем access token в ответе
                                response.data['access'] = str(token.access_token)
                                
                            except User.DoesNotExist:
                                pass
                except jwt.InvalidTokenError:
                    # Если не удалось декодировать, оставляем стандартный ответ
                    pass
                    
            except Exception as e:
                # Логируем ошибку, но не ломаем refresh
                import logging
                logger = logging.getLogger(__name__)
                logger.warning(f"Error preserving sid on refresh: {e}")
        
        return response

