"""Команда подтверждения ТМЦ (CONFIRM -> AVAILABLE)."""
from django.db import transaction
from ..models import Item
from ..enums import ItemStatus
from .lock_service import LockService
from .history_service import HistoryService
from .domain.item_transitions import ItemTransitions


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
            # Валидация перехода
            ItemTransitions.validate_confirm(item.status)

            # Изменяем статус на AVAILABLE
            item.status = ItemStatus.AVAILABLE
            item.save()

            # Записываем в историю
            HistoryService.confirmed(
                item=item,
                user=user,
                comment=comment,
                location_name=item.location,
            )

            return item.id

        finally:
            # Всегда разблокируем после изменения
            LockService.unlock(item_id, user)

