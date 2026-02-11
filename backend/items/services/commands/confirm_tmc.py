"""Команда подтверждения/отклонения ТМЦ кладовщиком."""
from django.db import transaction
from ..models import Item
from ..enums import ItemStatus
from .lock_service import LockService
from .history_service import HistoryService
from .domain.item_transitions import ItemTransitions
from .domain.history_actions import HistoryActions


class ConfirmTMCCommand:
    """
    Команда для принятия или отклонения ТМЦ.

    Command — изменяет состояние системы.
    """

    @staticmethod
    @transaction.atomic
    def execute(item_id: int, action: str, user) -> Item:
        """
        Единая точка входа для подтверждения/отклонения ТМЦ.

        Args:
            item_id: ID ТМЦ
            action: "accept" или "reject"
            user: Пользователь (объект User)

        Returns:
            Обновлённый объект Item

        Raises:
            ValueError: При некорректном действии или статусе
        """
        item = Item.objects.select_for_update().get(pk=item_id)

        # Валидация перехода
        ItemTransitions.validate_confirm(item.status)

        if action == "accept":
            return ConfirmTMCCommand._accept(item, user)
        elif action == "reject":
            return ConfirmTMCCommand._reject(item, user)
        else:
            raise ValueError(f"Неподдерживаемое действие: {action}")

    @staticmethod
    def _accept(item: Item, user) -> Item:
        """
        Принятие ТМЦ.

        Args:
            item: Объект ТМЦ (уже заблокирован транзакцией)
            user: Пользователь

        Returns:
            Обновлённый объект Item
        """
        item.status = ItemTransitions.STATUS_AFTER_CONFIRM
        item.responsible = user.username if hasattr(user, 'username') else str(user)
        item.save()

        HistoryService.create(
            item=item,
            action=HistoryActions.ACCEPTED,
            comment=f"Объект - {item.location}",
            user=user,
            location_name=item.location,
        )

        return item

    @staticmethod
    def _reject(item: Item, user) -> Item:
        """
        Отклонение ТМЦ — возврат на исходную локацию.

        Args:
            item: Объект ТМЦ (уже заблокирован транзакцией)
            user: Пользователь

        Returns:
            Обновлённый объект Item

        Raises:
            ValueError: Если невозможно восстановить исходное состояние
        """
        # Восстанавливаем из первой записи истории
        first_operation = HistoryService.get_first_assignment(item)

        if not first_operation:
            raise ValueError("Невозможно восстановить исходное состояние")

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

        location = item.location
        HistoryService.create(
            item=item,
            action=HistoryActions.rejected_with_location(location),
            user=user,
            location_name=location,
        )

        return item

