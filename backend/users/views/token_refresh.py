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
        
        return super().post(request, *args, **kwargs)

