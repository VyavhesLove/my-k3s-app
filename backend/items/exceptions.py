"""DRF Exception Handlers и доменные исключения."""
from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status
from rest_framework.exceptions import APIException

from .services.domain.exceptions import DomainError, DomainValidationError, DomainConflictError


class DomainException(APIException):
    """
    Базовый класс для доменных исключений в DRF.
    
    Этот класс используется для преобразования доменных исключений
    в HTTP-ответы. Сам доменный слой (DomainError) НЕ знает про HTTP.
    """
    status_code = status.HTTP_400_BAD_REQUEST
    default_detail = 'Ошибка бизнес-логики'
    default_code = 'domain_error'


class DomainValidationException(DomainException):
    """Ошибка валидации бизнес-правил (400)."""
    status_code = status.HTTP_400_BAD_REQUEST
    default_detail = 'Ошибка валидации'
    default_code = 'domain_validation_error'


class DomainConflictException(DomainException):
    """Ошибка конфликта состояния (409)."""
    status_code = status.HTTP_409_CONFLICT
    default_detail = 'Конфликт состояния'
    default_code = 'domain_conflict_error'


def domain_exception_handler(exc, context):
    """
    Кастомный обработчик исключений для DRF.
    
    Преобразует DomainError в понятные HTTP-ответы.
    
    Args:
        exc: Исключение
        context: Контекст запроса
        
    Returns:
        Response: HTTP-ответ с ошибкой
    """
    # Сначала вызываем стандартный обработчик DRF
    response = exception_handler(exc, context)
    
    # Если это доменное исключение - преобразуем в нужный формат
    if isinstance(exc, DomainValidationError):
        return Response(
            {
                'error': 'validation_error',
                'message': str(exc),
            },
            status=status.HTTP_400_BAD_REQUEST
        )
    
    if isinstance(exc, DomainConflictError):
        return Response(
            {
                'error': 'conflict_error',
                'message': str(exc),
            },
            status=status.HTTP_409_CONFLICT
        )
    
    if isinstance(exc, DomainError):
        return Response(
            {
                'error': 'domain_error',
                'message': str(exc),
            },
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Для остальных исключений возвращаем стандартный ответ
    return response

