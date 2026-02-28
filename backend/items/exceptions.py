"""Доменные исключения и глобальный Exception Handler."""
import logging
import traceback
from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status

from django.conf import settings
from django.http import HttpResponseRedirect
from urllib.parse import urlencode
from .services.domain.exceptions import DomainError, DomainValidationError, DomainConflictError, DomainNotFoundError
from .utils import api_response, api_error


# Настройка логирования
logger = logging.getLogger(__name__)


# =============================================================================
# Вспомогательные функции
# =============================================================================

def _is_api_request(request):
    """
    Определяет API это запрос или браузер.
    
    Returns:
        True - если это API запрос (JSON, AJAX)
        False - если это браузерный запрос
    """
    accept = request.headers.get('Accept', '')
    content_type = request.headers.get('Content-Type', '')
    x_requested_with = request.headers.get('X-Requested-With', '')
    
    # API: JSON в accept, Content-Type или AJAX
    if 'application/json' in accept or \
       'application/json' in content_type or \
       x_requested_with == 'XMLHttpRequest':
        return True
    return False


# =============================================================================
# Глобальный Exception Handler
# =============================================================================

def custom_exception_handler(exc, context):
    """
    Глобальный обработчик исключений для DRF.
    
    Поддерживает:
    - DRF исключения (ValidationError, NotFound, PermissionDenied, etc.)
    - Доменные исключения (DomainValidationError, DomainConflictError, DomainNotFoundError)
    - Стандартные Python исключения
    
    Особенности 401:
    - Для API запросов: возвращает JSON с redirect_url
    - Для браузера: редирект на /login/?next=/...
    
    Returns:
        Response: Унифицированный ответ в формате:
            Успех: {"success": true, "data": {...}, "message": "..."}
            Ошибка: {"success": false, "data": null, "error": "..."}
    """
    # Сначала вызываем стандартный обработчик DRF
    response = exception_handler(exc, context)
    
    # Обработка 401 ошибки - редирект для браузера, JSON для API
    if response is not None and response.status_code == 401:
        request = context['request']
        
        if _is_api_request(request):
            # API - добавляем redirect_url для удобства клиента
            data = response.data if hasattr(response, 'data') else {}
            if isinstance(data, dict):
                data['redirect_url'] = '/login/?next=' + request.path
            return response
        else:
            # Браузер - редирект на логин с next параметром
            login_url = '/login/'
            params = {'next': request.get_full_path()}
            redirect_url = login_url + '?' + urlencode(params)
            return HttpResponseRedirect(redirect_url)
    
    # Обработка DRF исключений (ValidationError, NotFound, PermissionDenied, etc.)
    if response is not None:
        # Получаем текст ошибки
        if hasattr(exc, 'detail'):
            if isinstance(exc.detail, dict):
                # Проверяем special case - non_field_errors
                if 'non_field_errors' in exc.detail:
                    errors = exc.detail['non_field_errors']
                    if isinstance(errors, list) and len(errors) > 0:
                        error_text = str(errors[0])
                    else:
                        error_text = str(errors)
                else:
                    # Форматируем обычные ошибки
                    error_text = str(exc.detail)
            elif isinstance(exc.detail, list):
                error_text = ", ".join(str(d) for d in exc.detail)
            else:
                error_text = str(exc.detail)
        else:
            error_text = str(exc)
        
        return api_error(
            error=error_text,
            status_code=response.status_code
        )
    
    # Доменные исключения
    
    if isinstance(exc, DomainValidationError):
        return api_error(
            error=str(exc),
            status_code=status.HTTP_400_BAD_REQUEST
        )
    
    if isinstance(exc, DomainConflictError):
        return api_error(
            error=str(exc),
            status_code=status.HTTP_409_CONFLICT
        )
    
    if isinstance(exc, DomainNotFoundError):
        return api_error(
            error=str(exc),
            status_code=status.HTTP_404_NOT_FOUND
        )
    
    if isinstance(exc, DomainError):
        return api_error(
            error=str(exc),
            status_code=status.HTTP_400_BAD_REQUEST
        )
    
    # Необработанные исключения - 500 Internal Server Error
    # Логируем полный traceback для отладки
    logger.error(
        f"Unhandled exception: {exc}\n{traceback.format_exc()}"
    )
    
    if settings.DEBUG:
        # В режиме DEBUG возвращаем полный traceback
        return api_error(
            error=f"Внутренняя ошибка сервера\n\n{traceback.format_exc()}",
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
    
    return api_error(
        error="Внутренняя ошибка сервера",
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
    )

