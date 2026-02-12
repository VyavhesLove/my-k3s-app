"""Команда возврата ТМЦ из сервиса."""
from __future__ import annotations

from django.db import transaction
from items.enums import ItemStatus
from ...services.lock_service import LockService
from ..history_service import HistoryService
from ..domain.item_transitions import ItemTransitions
from ..domain.exceptions import DomainValidationError


class ReturnFromServiceCommand:
    """
    Команда возврата ТМЦ из сервиса.

    workflow:
    1. send_to_service: issued/at_work → confirm_repair (отправка в ремонт)
    2. _confirm_repair: confirm_repair → in_repair (подтверждение ремонтником)
    3. _return_from_repair: in_repair → issued (возврат из ремонта)

    Command — изменяет состояние системы.
    Returns:
        int: ID изменённого ТМЦ
    """

    @staticmethod
    @transaction.atomic
    def execute(item_id: int, action: str, user) -> int:
        """
        Возвращает ТМЦ из сервиса.

        Args:
            item_id: ID ТМЦ
            action: "confirm_repair" - подтвердить начало ремонта,
                   "return" - вернуть из сервиса
            user: Пользователь (объект User)

        Returns:
            int: ID изменённого ТМЦ

        Raises:
            DomainValidationError: При некорректном действии или статусе
        """
        # Блокируем и проверяем права
        item = LockService.lock(item_id, user)

        try:
            if action == "confirm_repair":
                ReturnFromServiceCommand._confirm_repair(item, user)
            elif action == "return":
                ReturnFromServiceCommand._return(item, user)
            else:
                raise DomainValidationError(f"Неподдерживаемое действие: {action}")

            return item.id

        finally:
            LockService.unlock(item_id, user)

    @staticmethod
    def _confirm_repair(item, user):
        """
        Подтверждение начала ремонта.

        ТМЦ переходит из статуса confirm_repair в in_repair.

        Args:
            item: Объект ТМЦ (уже заблокирован)
            user: Пользователь

        Returns:
            Обновлённый объект Item
        """
        # Валидация: можно подтверждать ремонт только из статуса CONFIRM_REPAIR
        ItemTransitions.validate_transition(item.status, ItemStatus.IN_REPAIR)

        item.status = ItemStatus.IN_REPAIR
        item.save()

        HistoryService.repair_confirmed(
            item=item,
            user=user,
            location_name=item.location,
        )

        return item

    @staticmethod
    def _return(item, user):
        """
        Возврат ТМЦ из сервиса после завершения ремонта.

        ТМЦ переходит из статуса in_repair в issued.

        Args:
            item: Объект ТМЦ (уже заблокирован)
            user: Пользователь

        Returns:
            Обновлённый объект Item
        """
        # Валидация: можно возвращать только из статуса IN_REPAIR
        ItemTransitions.validate_transition(item.status, ItemStatus.ISSUED)

        item.status = ItemStatus.ISSUED
        item.save()

        HistoryService.returned_from_service(
            item=item,
            user=user,
            location_name=item.location,
        )

        return item
