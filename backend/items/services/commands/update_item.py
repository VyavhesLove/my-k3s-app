"""Команда обновления данных ТМЦ."""
from django.db import transaction
from ..models import Item
from .lock_service import LockService
from .history_service import HistoryService


class UpdateItemCommand:
    """
    Команда обновления данных ТМЦ.

    Command — изменяет состояние системы.
    Returns:
        int: ID изменённого ТМЦ
    """

    @staticmethod
    @transaction.atomic
    def execute(item_id: int, data: dict, user) -> int:
        """
        Обновляет данные ТМЦ.

        Args:
            item_id: ID ТМЦ
            data: Словарь с полями для обновления
            user: Пользователь (объект User)

        Returns:
            int: ID изменённого ТМЦ

        Raises:
            ValueError: При ошибках валидации
        """
        # Блокируем и проверяем права
        item = LockService.lock(item_id, user)

        try:
            old_status = item.status
            service_comment = data.pop("service_comment", None)

            # Обновляем поля
            for field, value in data.items():
                if hasattr(item, field):
                    setattr(item, field, value)

            item.save()

            # Если есть комментарий — пишем в историю
            if service_comment:
                if old_status != item.status:
                    HistoryService.updated(
                        item=item,
                        user=user,
                        comment=service_comment,
                        location_name=item.location,
                        old_status=old_status,
                        new_status=item.status,
                    )
                else:
                    HistoryService.updated(
                        item=item,
                        user=user,
                        comment=service_comment,
                        location_name=item.location,
                    )

            return item.id

        finally:
            LockService.unlock(item_id, user)

