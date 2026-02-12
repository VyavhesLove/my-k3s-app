"""Команда обновления данных ТМЦ."""
from __future__ import annotations

from django.db import transaction
from ...models import Item
from ..history_service import HistoryService


class UpdateItemCommand:
    """
    Команда обновления данных ТМЦ.

    Требования:
    - Полная транзакционная безопасность (@transaction.atomic)
    - Использование select_for_update() для защиты от race condition
    - Без использования LockService

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
        # 1. Блокируем строку через select_for_update()
        item = Item.objects.select_for_update().get(id=item_id)

        old_status = item.status
        service_comment = data.pop("service_comment", None)

        # 2. Обновляем поля
        for field, value in data.items():
            if hasattr(item, field):
                setattr(item, field, value)

        item.save()

        # 3. Записываем в историю если есть комментарий
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
