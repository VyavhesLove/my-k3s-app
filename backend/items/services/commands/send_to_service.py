"""Команда отправки ТМЦ в сервис на ремонт."""
from __future__ import annotations

from django.db import transaction
from items.enums import ItemStatus
from ...models import Item
from ..history_service import HistoryService
from ..domain.item_transitions import ItemTransitions


class SendToServiceCommand:
    """
    Команда отправки ТМЦ в сервис на ремонт.

    Переводит ТМЦ в статус "Ожидает подтверждения ремонта" (confirm_repair).
    Далее ремонтник должен подтвердить, что взял в работу (in_repair).

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
        # 1. Блокируем строку через select_for_update()
        item = Item.objects.select_for_update().get(id=item_id)

        # 2. Валидация перехода
        ItemTransitions.validate_send_to_service(item.status)

        # 3. Логика изменения
        old_status = item.status
        
        if item.brigade:
            item.brigade = None

        # Переводим в статус "Ожидает подтверждения ремонта"
        item.status = ItemStatus.CONFIRM_REPAIR
        item.save()

        # 4. Записываем в историю
        HistoryService.sent_to_service(
            item=item,
            user=user,
            reason=reason,
        )

        # История смены статуса
        HistoryService.status_changed(
            item=item,
            user=user,
            old_status=old_status,
            new_status=ItemStatus.CONFIRM_REPAIR,
            location=item.location,
        )

        return item.id
