"""Команда возврата ТМЦ из сервиса."""
from django.db import transaction
from ..models import Item
from ..enums import ItemStatus
from .lock_service import LockService
from .history_service import HistoryService
from .domain.item_transitions import ItemTransitions
from .domain.history_actions import HistoryActions


class ReturnFromServiceCommand:
    """
    Команда возврата ТМЦ из сервиса и подтверждения ремонта.

    Command — изменяет состояние системы.
    """

    @staticmethod
    @transaction.atomic
    def execute(item_id: int, action: str, user) -> Item:
        """
        Возвращает ТМЦ из сервиса.

        Args:
            item_id: ID ТМЦ
            action: "return" - вернуть из сервиса,
                   "confirm" - подтвердить завершение ремонта
            user: Пользователь (объект User)

        Returns:
            Обновлённый объект Item

        Raises:
            ValueError: При некорректном действии или статусе
        """
        # Блокируем и проверяем права
        item = LockService.lock(item_id, user)

        try:
            if action == "return":
                return ReturnFromServiceCommand._return(item, user)
            elif action == "confirm":
                return ReturnFromServiceCommand._confirm(item, user)
            else:
                raise ValueError(f"Неподдерживаемое действие: {action}")

        finally:
            LockService.unlock(item_id, user)

    @staticmethod
    def _return(item: Item, user) -> Item:
        """
        Возврат ТМЦ из сервиса (без подтверждения ремонта).

        ТМЦ переходит в статус CONFIRM_REPAIR и ожидает подтверждения.

        Args:
            item: Объект ТМЦ (уже заблокирован)
            user: Пользователь

        Returns:
            Обновлённый объект Item
        """
        # Валидация: можно возвращать только из статуса IN_REPAIR
        ItemTransitions.validate_return_from_service(item.status)

        item.status = ItemTransitions.STATUS_AFTER_SERVICE_RETURN
        item.save()

        HistoryService.create(
            item=item,
            action=HistoryActions.RETURNED_FROM_SERVICE,
            user=user,
            location_name=item.location,
        )

        return item

    @staticmethod
    def _confirm(item: Item, user) -> Item:
        """
        Подтверждение завершения ремонта.

        ТМЦ переходит в статус ISSUED и становится доступным.

        Args:
            item: Объект ТМЦ (уже заблокирован)
            user: Пользователь

        Returns:
            Обновлённый объект Item
        """
        # Валидация: можно подтверждать только из статуса CONFIRM_REPAIR
        if item.status != ItemStatus.CONFIRM_REPAIR:
            raise ValueError(
                f"Нельзя подтвердить ремонт. ТМЦ в статусе '{item.status}', "
                "ожидается 'confirm_repair'"
            )

        item.status = ItemStatus.ISSUED
        item.save()

        HistoryService.create(
            item=item,
            action=HistoryActions.REPAIR_CONFIRMED,
            user=user,
            location_name=item.location,
        )

        return item

