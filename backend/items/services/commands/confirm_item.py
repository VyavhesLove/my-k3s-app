"""Команда подтверждения ТМЦ (CONFIRM -> AVAILABLE)."""
from __future__ import annotations

from django.db import transaction
from items.enums import ItemStatus
from ...services.lock_service import LockService
from ..history_service import HistoryService
from ..domain.item_transitions import ItemTransitions
from ..domain.exceptions import DomainValidationError


class ConfirmItemCommand:
    """
    Команда подтверждения ТМЦ (статус confirm -> available).

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
        # Блокируем и проверяем права
        item = LockService.lock(item_id, user)

        try:
            # Валидация перехода: только CONFIRM -> AVAILABLE
            if item.status != ItemStatus.CONFIRM:
                raise DomainValidationError(
                    f"Невозможно подтвердить ТМЦ. Статус должен быть 'confirm', а не '{item.status}'"
                )

            # Изменяем статус на AVAILABLE
            item.status = ItemStatus.AVAILABLE
            item.save()

            # Записываем в историю
            HistoryService.confirmed(
                item=item,
                user=user,
                comment=comment,
                location=item.location,
            )

            return item.id

        finally:
            # Всегда разблокируем после изменения
            LockService.unlock(item_id, user)
