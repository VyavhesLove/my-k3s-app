"""Команда подтверждения/отклонения ТМЦ кладовщиком."""
from django.db import transaction
from ..models import Item
from ..enums import ItemStatus
from .lock_service import LockService
from .history_service import HistoryService
from .domain.item_transitions import ItemTransitions
from .domain.exceptions import DomainValidationError


class ConfirmTMCCommand:
    """
    Команда для принятия или отклонения ТМЦ.

    Command — изменяет состояние системы.
    Returns:
        int: ID изменённого ТМЦ
    """

    @staticmethod
    @transaction.atomic
    def execute(item_id: int, action: str, user) -> int:
        """
        Единая точка входа для подтверждения/отклонения ТМЦ.

        Args:
            item_id: ID ТМЦ
            action: "accept" или "reject"
            user: Пользователь (объект User)

        Returns:
            int: ID изменённого ТМЦ

        Raises:
            DomainValidationError: При некорректном действии или статусе
        """
        item = LockService.lock(item_id, user)

        try:
            # Валидация перехода
            ItemTransitions.validate_confirm(item.status)

            if action == "accept":
                ConfirmTMCCommand._accept(item, user)
            elif action == "reject":
                ConfirmTMCCommand._reject(item, user)
            else:
                raise DomainValidationError(f"Неподдерживаемое действие: {action}")

            return item.id

        finally:
            LockService.unlock(item_id, user)

    @staticmethod
    def _accept(item: Item, user) -> None:
        """
        Принятие ТМЦ.

        Args:
            item: Объект ТМЦ (уже заблокирован транзакцией)
            user: Пользователь
        """
        item.status = ItemStatus.AVAILABLE
        item.responsible = user.username if hasattr(user, 'username') else str(user)
        item.save()

        HistoryService.accepted(
            item=item,
            user=user,
            location_name=item.location,
        )

    @staticmethod
    def _reject(item: Item, user) -> None:
        """
        Отклонение ТМЦ — возврат на исходную локацию.

        Args:
            item: Объект ТМЦ (уже заблокирован транзакцией)
            user: Пользователь

        Raises:
            DomainValidationError: Если невозможно восстановить исходное состояние
        """
        # Восстанавливаем из первой записи истории
        first_operation = HistoryService.get_first_assignment(item)

        if not first_operation:
            raise DomainValidationError("Невозможно восстановить исходное состояние")

        item.status = ItemStatus.ISSUED
        item.location = (
            first_operation.location.name
            if first_operation.location
            else item.location
        )
        item.responsible = (
            first_operation.user.username
            if first_operation.user
            else None
        )
        item.save()

        HistoryService.rejected(
            item=item,
            user=user,
            location_name=item.location,
        )

