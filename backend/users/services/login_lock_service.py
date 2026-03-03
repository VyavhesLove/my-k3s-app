"""Сервис для управления блокировкой пользователей при неверном пароле."""
import redis
from django.conf import settings
import logging

logger = logging.getLogger(__name__)


class LoginLockService:
    """
    Сервис для управления блокировкой пользователей при неверном пароле.
    
    Использует Redis для хранения счётчика попыток входа.
    Ключ: login_attempts:{username}:{ip}
    TTL: 300 секунд (5 минут)
    """
    
    # TTL в секундах (5 минут)
    TTL_SECONDS = 300
    # Максимальное количество попыток до бана
    MAX_ATTEMPTS = 3
    
    _redis_client = None
    
    @classmethod
    def _get_redis_client(cls):
        """Получает или создаёт Redis клиент."""
        if cls._redis_client is None:
            cls._redis_client = redis.from_url(
                settings.REDIS_URL,
                decode_responses=True
            )
        return cls._redis_client
    
    @classmethod
    def get_attempts_key(cls, username: str, ip: str) -> str:
        """
        Формирует ключ для хранения попыток входа.
        
        Args:
            username: Имя пользователя
            ip: IP адрес клиента
            
        Returns:
            Ключ в формате login_attempts:{username}:{ip}
        """
        # Нормализуем username для ключа (нижний регистр, убираем пробелы)
        normalized_username = username.lower().strip()
        return f"login_attempts:{normalized_username}:{ip}"
    
    @classmethod
    def increment_attempts(cls, username: str, ip: str) -> int:
        """
        Инкрементирует счётчик попыток входа.
        При первой попытке устанавливает TTL.
        
        Args:
            username: Имя пользователя
            ip: IP адрес клиента
            
        Returns:
            Текущее количество попыток
        """
        client = cls._get_redis_client()
        key = cls.get_attempts_key(username, ip)
        
        try:
            # Пытаемся получить текущее значение
            current = client.get(key)
            
            if current is None:
                # Первая попытка - устанавливаем TTL
                client.setex(key, cls.TTL_SECONDS, 1)
                logger.info(f"Первая попытка входа для {username} с IP {ip}. TTL установлен на {cls.TTL_SECONDS} сек.")
                return 1
            else:
                # Последующие попытки
                new_value = client.incr(key)
                logger.info(f"Попытка входа #{new_value} для {username} с IP {ip}")
                return new_value
        except redis.RedisError as e:
            logger.error(f"Ошибка Redis при инкременте попыток: {e}")
            # При ошибке Redis не блокируем пользователя
            return 0
    
    @classmethod
    def is_banned(cls, username: str, ip: str) -> bool:
        """
        Проверяет, забанен ли пользователь по IP.
        
        Args:
            username: Имя пользователя
            ip: IP адрес клиента
            
        Returns:
            True если количество попыток >= MAX_ATTEMPTS
        """
        client = cls._get_redis_client()
        key = cls.get_attempts_key(username, ip)
        
        try:
            current = client.get(key)
            if current is None:
                return False
            
            attempts = int(current)
            return attempts >= cls.MAX_ATTEMPTS
        except redis.RedisError as e:
            logger.error(f"Ошибка Redis при проверке бана: {e}")
            # При ошибке Redis не блокируем пользователя
            return False
    
    @classmethod
    def clear_attempts(cls, username: str, ip: str) -> bool:
        """
        Очищает счётчик попыток при успешном входе.
        
        Args:
            username: Имя пользователя
            ip: IP адрес клиента
            
        Returns:
            True если ключ был удалён
        """
        client = cls._get_redis_client()
        key = cls.get_attempts_key(username, ip)
        
        try:
            result = client.delete(key)
            if result:
                logger.info(f"Счётчик попыток очищен для {username} с IP {ip}")
            return result > 0
        except redis.RedisError as e:
            logger.error(f"Ошибка Redis при очистке попыток: {e}")
            return False
    
    @classmethod
    def get_remaining_seconds(cls, username: str, ip: str) -> int:
        """
        Возвращает оставшееся время до снятия бана в секундах.
        
        Args:
            username: Имя пользователя
            ip: IP адрес клиента
            
        Returns:
            Оставшееся время в секундах, или 0 если нет бана
        """
        client = cls._get_redis_client()
        key = cls.get_attempts_key(username, ip)
        
        try:
            ttl = client.ttl(key)
            if ttl == -2:  # Key не существует
                return 0
            return max(0, ttl)
        except redis.RedisError as e:
            logger.error(f"Ошибка Redis при получении TTL: {e}")
            return 0
    
    @classmethod
    def get_attempts_count(cls, username: str, ip: str) -> int:
        """
        Возвращает текущее количество попыток.
        
        Args:
            username: Имя пользователя
            ip: IP адрес клиента
            
        Returns:
            Количество попыток, или 0 если нет записей
        """
        client = cls._get_redis_client()
        key = cls.get_attempts_key(username, ip)
        
        try:
            current = client.get(key)
            if current is None:
                return 0
            return int(current)
        except redis.RedisError as e:
            logger.error(f"Ошибка Redis при получении количества попыток: {e}")
            return 0

