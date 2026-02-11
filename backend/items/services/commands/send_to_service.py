"""Команда отправки ТМЦ в сервис на ремонт."""
from django.db import transaction
from ..models import Item
from ..enums import ItemStatus
from .lock_service import LockService
from .history_service import HistoryService
from .domain.item_transitions import ItemTransitions
from .domain.history_actions import HistoryActions


class SendToServiceCommand:
    """
    Команда отправки ТМЦ в сервис на ремонт.

    Command — изменяет состояние системы.
    """

    @staticmethod
    @transaction.atomic
    def execute(item_id: int, reason: str, user) -> Item:
        """
        Отправляет ТМЦ в сервис.

        Args:
            item_id: ID ТМЦ
            reason: Причина отправки в сервис
            user: Пользователь (объект User)

        Returns:
            Обновлённый объект Item

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

            item.status = ItemStatus.IN_REPAIR
            item.save()

            # Записываем в историю
            HistoryService.create(
                item=item,
                action=HistoryActions.sent_to_service(reason),
                user=user,
                location_name=item.location,
            )

            return item

        finally:
            # Всегда разблокируем после изменения
            LockService.unlock(item_id, user)

