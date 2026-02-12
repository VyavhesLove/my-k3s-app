"""Утилиты для тестирования API.

Содержит базовый класс и helper-функции для проверки ответов API
в едином формате: {"success": True/False, "data": ..., "error": ...}
"""
from django.test import TestCase


class APITestCase(TestCase):
    """
    Базовый класс для API тестов с helper-методами для проверки ответов.
    
    Пример использования:
        class MyAPITestCase(APITestCase):
            def test_create_item(self):
                response = self.client.post('/api/items/', data)
                self.assert_api_success(response, expected_data)
            
            def test_not_found(self):
                response = self.client.get('/api/items/999/')
                self.assert_api_error(response, "ТМЦ не найдено", status=404)
    """
    
    def assert_api_success(self, response, expected_data=None):
        """
        Проверка успешного ответа API.
        
        Args:
            response: Ответ от DRF API client
            expected_data: Ожидаемые данные в response.data['data'] (опционально)
        """
        self.assertEqual(response.data["success"], True)
        self.assertIsNone(response.data.get("error"))
        self.assertIn("data", response.data)
        if expected_data is not None:
            self.assertEqual(response.data["data"], expected_data)
    
    def assert_api_error(self, response, error_msg, status=400):
        """
        Проверка ошибочного ответа API.
        
        Args:
            response: Ответ от DRF API client
            error_msg: Ожидаемый текст ошибки в response.data['error']
            status: Ожидаемый HTTP статус код (по умолчанию 400)
        """
        self.assertEqual(response.data["success"], False)
        self.assertIsNone(response.data["data"])
        self.assertEqual(response.data["error"], error_msg)
        self.assertEqual(response.status_code, status)


# Функции-утилиты для использования без наследования от APITestCase
def assert_api_success(response, expected_data=None):
    """
    Функция для проверки успешного ответа API.
    
    Args:
        response: Ответ от DRF API client
        expected_data: Ожидаемые данные в response.data['data'] (опционально)
    
    Raises:
        AssertionError: Если ответ не соответствует ожиданиям
    """
    assert response.data['success'] is True, f"Expected success=True, got {response.data.get('success')}"
    assert response.data.get('error') is None, f"Expected no error, got {response.data.get('error')}"
    assert 'data' in response.data, "Expected 'data' key in response"
    if expected_data is not None:
        assert response.data['data'] == expected_data, f"Expected {expected_data}, got {response.data['data']}"


def assert_api_error(response, error_msg, status_code=400):
    """
    Функция для проверки ошибочного ответа API.
    
    Args:
        response: Ответ от DRF API client
        error_msg: Ожидаемый текст ошибки
        status_code: Ожидаемый HTTP статус код (по умолчанию 400)
    
    Raises:
        AssertionError: Если ответ не соответствует ожиданиям
    """
    assert response.data['success'] is False, f"Expected success=False, got {response.data.get('success')}"
    assert response.data['data'] is None, f"Expected data=None, got {response.data.get('data')}"
    assert response.data['error'] == error_msg, f"Expected error='{error_msg}', got '{response.data.get('error')}'"
    assert response.status_code == status_code, f"Expected status_code={status_code}, got {response.status_code}"

