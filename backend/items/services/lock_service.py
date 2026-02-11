"""Сервис блокировки ТМЦ для предотвращения одновременного редактирования."""
from django.db import transaction
from django.utils import timezone
from ..models import Item
from .history_service import HistoryService
from .domain.history_actions import HistoryActions


class LockService:
    """
    Сервис для блокировки/разблокировки ТМЦ.

    Обеспечивает:
    - Блокировку ТМЦ перед изменением
    - Проверку прав на блокировку
    - Автоматическую разблокировку
    """

    @staticmethod
    @transaction.atomic
    def lock(item_id: int, user) -> Item:
        """
        Блокирует ТМЦ для редактирования.

        Args:
            item_id: ID ТМЦ
            user: Пользователь (объект User)

        Returns:
            Заблокированный объект Item

        Raises:
            ValueError: Если ТМЦ уже заблокировано другим пользователем
        """
        item = Item.objects.select_for_update().get(id=item_id)

        if item.locked_by and item.locked_by != user:
            raise ValueError(
                f"ТМЦ заблокировано пользователем: {item.locked_by.username}"
            )

        item.locked_by = user
        item.locked_at = timezone.now()
        item.save()

        HistoryService.create(
            item=item,
            action=HistoryActions.locked(user.username),
            user=user,
            location_name=item.location,
        )

        return item

    @staticmethod
    @transaction.atomic
    def unlock(item_id: int, user) -> None:
        """
        Разблокирует ТМЦ.

        Args:
            item_id: ID ТМЦ
            user: Пользователь (объект User)

        Raises:
            ValueError: Если нет прав на разблокировку
        """
        item = Item.objects.select_for_update().get(id=item_id)

        if item.locked_by and item.locked_by != user:
            raise ValueError("Нет прав на разблокировку")

        item.locked_by = None
        item.locked_at = None
        item.save()

    @staticmethod
    def is_locked(item: Item) -> bool:
        """Проверяет, заблокировано ли ТМЦ."""
        return item.locked_by is not None

    @staticmethod
    def can_edit(item: Item, user) -> bool:
        """Проверяет, может ли пользователь редактировать ТМЦ."""
        return item.locked_by is None or item.locked_by == user

