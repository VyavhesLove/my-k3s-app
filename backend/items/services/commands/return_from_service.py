"""Команда возврата ТМЦ из сервиса."""
from __future__ import annotations

from django.db import transaction
from items.enums import ItemStatus
from ...models import Item
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
    def execute(item_id: int, action: str, user) -> int:
        """
        Возвращает ТМЦ из сервиса.

        Args:
            item_id: ID ТМЦ
            action: "confirm_repair" - подтвердить начало ремонта,
                   "return" - вернуть из сервиса,
                   "write_off" - списать ТМЦ
            user: Пользователь (объект User)

        Returns:
            int: ID изменённого ТМЦ

        Raises:
            DomainValidationError: При некорректном действии или статусе
        """
        # 1. Блокируем строку через select_for_update()
        item = Item.objects.select_for_update().get(id=item_id)

        # 2. Выполняем действие
        if action == "confirm_repair":
            ReturnFromServiceCommand._confirm_repair(item, user)
        elif action == "return":
            ReturnFromServiceCommand._return(item, user)
        elif action == "write_off":
            ReturnFromServiceCommand._write_off(item, user)
        else:
            raise DomainValidationError(f"Неподдерживаемое действие: {action}")

        return item.id

    @staticmethod
    def _confirm_repair(item, user):
        """
        Подтверждение начала ремонта.

        ТМЦ переходит из статуса confirm_repair в in_repair.

        Args:
            item: Объект ТМЦ (уже заблокирован)
            user: Пользователь
        """
        # Валидация: можно подтверждать ремонт только из статуса CONFIRM_REPAIR
        old_status = item.status
        ItemTransitions.validate_transition(item.status, ItemStatus.IN_REPAIR)

        item.status = ItemStatus.IN_REPAIR
        item.save()

        HistoryService.repair_confirmed(
            item=item,
            user=user,
            location=item.location,
        )

        # История смены статуса
        HistoryService.status_changed(
            item=item,
            user=user,
            old_status=old_status,
            new_status=ItemStatus.IN_REPAIR,
            location=item.location,
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
        """
        # Валидация: можно возвращать только из статуса IN_REPAIR
        old_status = item.status
        ItemTransitions.validate_transition(item.status, ItemStatus.ISSUED)

        item.status = ItemStatus.ISSUED
        item.save()

        HistoryService.returned_from_service(
            item=item,
            user=user,
            location=item.location,
        )

        # История смены статуса
        HistoryService.status_changed(
            item=item,
            user=user,
            old_status=old_status,
            new_status=ItemStatus.ISSUED,
            location=item.location,
        )

        return item

    @staticmethod
    def _write_off(item, user):
        """
        Списание ТМЦ из статуса "Подтвердить ремонт".

        ТМЦ переходит из статуса confirm_repair в written_off.

        Args:
            item: Объект ТМЦ (уже заблокирован)
            user: Пользователь
        """
        # Валидация: можно списывать только из статуса CONFIRM_REPAIR
        old_status = item.status
        ItemTransitions.validate_transition(item.status, ItemStatus.WRITTEN_OFF)

        item.status = ItemStatus.WRITTEN_OFF
        item.save()

        HistoryService.written_off(
            item=item,
            user=user,
            reason="Списание из подтверждения ремонта",
            amount=0,
            location=item.location,
        )

        # История смены статуса
        HistoryService.status_changed(
            item=item,
            user=user,
            old_status=old_status,
            new_status=ItemStatus.WRITTEN_OFF,
            location=item.location,
        )

        return item
