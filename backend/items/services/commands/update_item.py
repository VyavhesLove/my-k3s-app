"""Команда обновления данных ТМЦ."""
from django.db import transaction
from ..models import Item
from .lock_service import LockService
from .history_service import HistoryService
from .domain.history_actions import HistoryActions


class UpdateItemCommand:
    """
    Команда обновления данных ТМЦ.

    Command — изменяет состояние системы.
    """

    @staticmethod
    @transaction.atomic
    def execute(item_id: int, data: dict, user) -> Item:
        """
        Обновляет данные ТМЦ.

        Args:
            item_id: ID ТМЦ
            data: Словарь с полями для обновления
            user: Пользователь (объект User)

        Returns:
            Обновлённый объект Item

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
                    action = HistoryActions.status_changed(
                        old_status=str(old_status),
                        new_status=str(item.status),
                    )
                else:
                    action = HistoryActions.UPDATED

                HistoryService.create(
                    item=item,
                    action=action,
                    comment=service_comment,
                    user=user,
                    location_name=item.location,
                )

            return item

        finally:
            LockService.unlock(item_id, user)

