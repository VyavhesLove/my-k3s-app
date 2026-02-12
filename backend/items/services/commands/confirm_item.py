"""Команда подтверждения ТМЦ (CONFIRM -> AVAILABLE)."""
from __future__ import annotations

from django.db import transaction
from items.enums import ItemStatus
from ...models import Item
from ..history_service import HistoryService
from ..domain.exceptions import DomainValidationError


class ConfirmItemCommand:
    """
    Команда подтверждения ТМЦ (статус confirm -> available).

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
    def execute(item_id: int, comment: str, user) -> int:
        """
        Подтверждает ТМЦ и принимает на склад.

        Args:
            item_id: ID ТМЦ
            comment: Комментарий к подтверждению
            user: Пользователь (объект User)

        Returns:
            int: ID изменённого ТМЦ

        Raises:
            ValueError: При некорректном статусе ТМЦ
        """
        # 1. Блокируем строку через select_for_update()
        item = Item.objects.select_for_update().get(id=item_id)

        # 2. Валидация перехода: только CONFIRM -> AVAILABLE
        if item.status != ItemStatus.CONFIRM:
            raise DomainValidationError(
                f"Невозможно подтвердить ТМЦ. Статус должен быть 'confirm', а не '{item.status}'"
            )

        # 3. Изменяем статус на AVAILABLE
        old_status = item.status
        item.status = ItemStatus.AVAILABLE
        item.save()

        # 4. Записываем в историю
        HistoryService.confirmed(
            item=item,
            user=user,
            comment=comment,
            location=item.location,
        )

        # История смены статуса
        HistoryService.status_changed(
            item=item,
            user=user,
            old_status=old_status,
            new_status=ItemStatus.AVAILABLE,
            location=item.location,
        )

        return item.id
