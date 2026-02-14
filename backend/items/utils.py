"""Универсальный Response Wrapper для API."""
from rest_framework.response import Response
from rest_framework import status


def api_response(data=None, message="", status_code=200):
    """
    Универсальный ответ API.
    
    Использование:
        return api_response(data=serializer.data)           # Без message
        return api_response(data=serializer.data, message="ТМЦ создано")  # С message
        raise DomainValidationError("Ошибка")  # Автоматически 400
        raise DomainConflictError("Заблокировано")  # Автоматически 409
    
    Args:
        data: Данные ответа (любой JSON-сериализуемый объект)
        message: Опциональное сообщение об успехе
        status_code: HTTP статус код (по умолчанию 200)
    
    Returns:
        Response: DRF Response с унифицированным форматом
    """
    response_data = {
        "success": True,
        "data": data,
    }
    
    if message:
        response_data["message"] = message
    
    return Response(response_data, status=status_code)


def api_error(error, status_code=400):
    """
    Универсальный ответ об ошибке API.
    
    Использование:
        return api_error("ТМЦ не найдено", 404)
        raise DomainValidationError("Ошибка")  # Рекомендуется через exception handler
    
    Args:
        error: Текст ошибки
        status_code: HTTP статус код (по умолчанию 400)
    
    Returns:
        Response: DRF Response с унифицированным форматом ошибки
    """
    response_data = {
        "success": False,
        "data": None,
        "error": error,
    }
    
    return Response(response_data, status=status_code)

