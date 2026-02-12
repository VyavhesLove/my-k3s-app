"""Команда отправки ТМЦ в сервис на ремонт."""
from __future__ import annotations

from django.db import transaction
from items.enums import ItemStatus
from ...services.lock_service import LockService
from ..history_service import HistoryService
from ..domain.item_transitions import ItemTransitions


class SendToServiceCommand:
    """
    Команда отправки ТМЦ в сервис на ремонт.

    Переводит ТМЦ в статус "Ожидает подтверждения ремонта" (confirm_repair).
    Далее ремонтник должен подтвердить, что взял в работу (in_repair).

    Command — изменяет состояние системы.
    Returns:
        int: ID изменённого ТМЦ
    """

    @staticmethod
    @transaction.atomic
    def execute(item_id: int, reason: str, user) -> int:
        """
        Отправляет ТМЦ в сервис.

        Args:
            item_id: ID ТМЦ
            reason: Причина отправки в сервис
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
            ItemTransitions.validate_send_to_service(item.status)

            # Логика изменения
            if item.brigade:
                item.brigade = None

            # Переводим в статус "Ожидает подтверждения ремонта"
            item.status = ItemStatus.CONFIRM_REPAIR
            item.save()

            # Записываем в историю
            HistoryService.sent_to_service(
                item=item,
                user=user,
                reason=reason,
            )

            return item.id

        finally:
            # Всегда разблокируем после изменения
            LockService.unlock(item_id, user)
