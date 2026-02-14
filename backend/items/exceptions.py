"""Доменные исключения и глобальный Exception Handler."""
import logging
import traceback
from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status

from django.conf import settings
from .services.domain.exceptions import DomainError, DomainValidationError, DomainConflictError, DomainNotFoundError
from .utils import api_response, api_error


# Настройка логирования
logger = logging.getLogger(__name__)


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
    
    Returns:
        Response: Унифицированный ответ в формате:
            Успех: {"success": true, "data": {...}, "message": "..."}
            Ошибка: {"success": false, "data": null, "error": "..."}
    """
    # Сначала вызываем стандартный обработчик DRF
    response = exception_handler(exc, context)
    
    # Обработка DRF исключений (ValidationError, NotFound, PermissionDenied, etc.)
    if response is not None:
        # Получаем текст ошибки
        if hasattr(exc, 'detail'):
            if isinstance(exc.detail, dict):
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

