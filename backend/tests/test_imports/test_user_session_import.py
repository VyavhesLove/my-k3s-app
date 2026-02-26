"""
Тест для проверки импорта модели UserSession из models_session.py.

Этот тест позволяет выявлять проблемы с импортом модели UserSession
на раннем этапе, чтобы избежать ошибок в runtime.

Проблема: в models.py определена только ссылка на models_session.py,
но сама модель UserSession находится в отдельном файле. Если файл
models_session.py будет удалён или в нём возникнут ошибки,
этот тест сразу покажет проблему.
"""
import pytest
from django.test import TestCase


class TestUserSessionImport(TestCase):
    """Тесты для проверки импорта модели UserSession."""

    def test_import_user_session_from_models_session(self):
        """Проверка успешного импорта UserSession из models_session.py."""
        # Этот тест проверяет, что модель UserSession может быть импортирована
        # из файла models_session.py без ошибок
        from users.models_session import UserSession
        
        # Проверяем, что импортированный объект является классом модели
        self.assertTrue(hasattr(UserSession, '_meta'))
        self.assertEqual(UserSession.__name__, 'UserSession')

    def test_import_user_session_from_models_package(self):
        """Проверка импорта UserSession через models package."""
        # Тест проверяет, что модель доступна для импорта
        # (может использоваться в других частях кода)
        from users.models_session import UserSession
        
        # Проверяем наличие обязательных полей модели
        self.assertTrue(hasattr(UserSession, 'user'))
        self.assertTrue(hasattr(UserSession, 'token_id'))
        self.assertTrue(hasattr(UserSession, 'user_agent'))
        self.assertTrue(hasattr(UserSession, 'ip_address'))
        self.assertTrue(hasattr(UserSession, 'created_at'))
        self.assertTrue(hasattr(UserSession, 'last_activity'))
        self.assertTrue(hasattr(UserSession, 'is_active'))
        self.assertTrue(hasattr(UserSession, 'description'))

    def test_user_session_model_fields(self):
        """Проверка корректности полей модели UserSession."""
        from users.models_session import UserSession
        
        # Получаем мета-информацию о модели
        meta = UserSession._meta
        
        # Проверяем название модели
        self.assertEqual(meta.model_name, 'usersession')
        
        # Проверяем наличие primary key (id) - автоматически создаётся Django
        self.assertTrue(hasattr(UserSession, 'id'))
        
        # Проверяем, что есть поле user (ForeignKey)
        field_names = [f.name for f in meta.get_fields()]
        self.assertIn('user', field_names)
        
        # Проверяем, что таблица связана с пользователем
        user_field = meta.get_field('user')
        self.assertEqual(user_field.related_model.__name__, 'User')

    def test_user_session_can_be_instantiated(self):
        """Проверка возможности создания экземпляра модели UserSession."""
        from django.contrib.auth import get_user_model
        from users.models_session import UserSession
        
        User = get_user_model()
        
        # Создаём тестового пользователя
        user = User.objects.create_user(
            username='test_session_user',
            password='testpass123'
        )
        
        # Создаём сессию
        session = UserSession.objects.create(
            user=user,
            token_id='test_token_12345',
            user_agent='Test Browser',
            ip_address='127.0.0.1',
            description='Test Session'
        )
        
        # Проверяем, что сессия создана корректно
        self.assertEqual(session.user, user)
        self.assertEqual(session.token_id, 'test_token_12345')
        self.assertTrue(session.is_active)
        
        # Очищаем
        session.delete()
        user.delete()

    def test_user_session_str_method(self):
        """Проверка метода __str__ модели UserSession."""
        from django.contrib.auth import get_user_model
        from users.models_session import UserSession
        
        User = get_user_model()
        
        user = User.objects.create_user(
            username='test_str_user',
            password='testpass123'
        )
        
        session = UserSession.objects.create(
            user=user,
            token_id='abc12345',
            description='Main Browser'
        )
        
        # Проверяем метод __str__
        str_repr = str(session)
        self.assertIn('test_str_user', str_repr)
        
        # Очищаем
        session.delete()
        user.delete()

