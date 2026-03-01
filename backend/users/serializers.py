"""Сериализаторы для создания пользователей."""
from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import UserRole

User = get_user_model()


class CreateUserSerializer(serializers.Serializer):
    """
    Сериализатор для создания пользователя.
    
    Поля:
    - username: обязательное, уникальное
    - email: обязательное, уникальное  
    - first_name: имя
    - last_name: фамилия
    - surname: отчество
    - role: роль пользователя
    - active: активен
    - password: пароль
    - confirm_password: подтверждение пароля
    """
    username = serializers.CharField(
        max_length=150,
        required=True,
        help_text="Имя пользователя (логин)"
    )
    email = serializers.EmailField(
        required=True,
        help_text="Электронная почта"
    )
    first_name = serializers.CharField(
        max_length=150,
        required=False,
        allow_blank=True,
        help_text="Имя"
    )
    last_name = serializers.CharField(
        max_length=150,
        required=False,
        allow_blank=True,
        help_text="Фамилия"
    )
    surname = serializers.CharField(
        max_length=150,
        required=False,
        allow_blank=True,
        help_text="Отчество"
    )
    role = serializers.ChoiceField(
        choices=UserRole.choices,
        default=UserRole.FOREMAN,
        help_text="Роль пользователя"
    )
    active = serializers.BooleanField(
        default=True,
        help_text="Активен"
    )
    password = serializers.CharField(
        write_only=True,
        required=True,
        min_length=8,
        help_text="Пароль (минимум 8 символов)"
    )
    confirm_password = serializers.CharField(
        write_only=True,
        required=True,
        help_text="Подтверждение пароля"
    )

    def validate_username(self, value):
        """Проверка уникальности username."""
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("Пользователь с таким username уже существует")
        return value

    def validate_email(self, value):
        """Проверка уникальности email."""
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("Пользователь с таким email уже существует")
        return value

    def validate(self, attrs):
        """Проверка совпадения паролей."""
        password = attrs.get('password')
        confirm_password = attrs.get('confirm_password')

        if password != confirm_password:
            raise serializers.ValidationError({
                'confirm_password': 'Пароль и подтверждение пароля не совпадают'
            })

        return attrs

    def create(self, validated_data):
        """Создание пользователя."""
        # Удаляем confirm_password из данных
        validated_data.pop('confirm_password')
        
        # Создаём пользователя
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
            surname=validated_data.get('surname', ''),
            role=validated_data.get('role', UserRole.FOREMAN),
            active=validated_data.get('active', True),
        )
        
        return user


class UserResponseSerializer(serializers.ModelSerializer):
    """
    Сериализатор для ответа с данными пользователя.
    """
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'surname', 'role', 'active', 'date_joined']
        read_only_fields = fields


class MaintenanceModeSerializer(serializers.Serializer):
    """
    Serializer для управления режимом обслуживания.
    Корректно обрабатывает boolean значения через DRF serializer,
    избегая проблемы с bool(...) для строковых значений ("false", "0").
    """
    enabled = serializers.BooleanField(required=False, default=False)
    planned_end_time = serializers.DateTimeField(required=False, allow_null=True)
    message = serializers.CharField(read_only=True)

