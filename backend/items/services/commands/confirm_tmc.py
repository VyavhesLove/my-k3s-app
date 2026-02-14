"""Команда подтверждения/отклонения ТМЦ кладовщиком."""
from __future__ import annotations

from django.db import transaction
from items.enums import ItemStatus
from ...models import Item
from ..history_service import HistoryService
from ..domain.exceptions import DomainValidationError


class ConfirmTMCCommand:
    """
    Команда для принятия или отклонения ТМЦ.

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
        # 1. Блокируем строку через select_for_update()
        item = Item.objects.select_for_update().get(id=item_id)

        # 2. Выполняем действие
        if action == "accept":
            # accept: CREATED → AVAILABLE
            ConfirmTMCCommand._validate_accept(item.status)
            ConfirmTMCCommand._accept(item, user)
        elif action == "reject":
            # reject: CONFIRM → ISSUED
            ConfirmTMCCommand._validate_reject(item.status)
            ConfirmTMCCommand._reject(item, user)
        else:
            raise DomainValidationError(f"Неподдерживаемое действие: {action}")

        return item.id

    @staticmethod
    def _validate_accept(status: ItemStatus) -> None:
        """Валидация принятия ТМЦ (CONFIRM → AVAILABLE)."""
        if status != ItemStatus.CONFIRM:
            raise DomainValidationError(
                f"Невозможно принять ТМЦ. Статус должен быть 'confirm', а не '{status}'"
            )

    @staticmethod
    def _validate_reject(status: ItemStatus) -> None:
        """Валидация отклонения ТМЦ (CONFIRM → ISSUED)."""
        if status != ItemStatus.CONFIRM:
            raise DomainValidationError(
                f"Невозможно отклонить ТМЦ. Статус должен быть 'confirm', а не '{status}'"
            )

    @staticmethod
    def _accept(item, user) -> None:
        """
        Принятие ТМЦ.

        Args:
            item: Объект ТМЦ (уже заблокирован транзакцией)
            user: Пользователь
        """
        old_status = item.status
        
        item.status = ItemStatus.AVAILABLE
        item.responsible = user.username if hasattr(user, 'username') else str(user)
        item.save()

        HistoryService.accepted(
            item=item,
            user=user,
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

    @staticmethod
    def _reject(item, user) -> None:
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

        old_status = item.status
        
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
