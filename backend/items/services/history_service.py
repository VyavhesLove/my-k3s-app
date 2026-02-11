"""Централизованный сервис для создания записей истории."""
from django.db import models
from ..models import Item, ItemHistory, Location
from .domain.history_actions import HistoryActionsFormatter
from ..enums import HistoryAction


class HistoryService:
    """Сервис для работы с историей ТМЦ."""

    @staticmethod
    def create(
        item: Item,
        action: str,
        action_type: HistoryAction = None,
        user=None,
        comment: str = None,
        location_name: str = None,
    ) -> ItemHistory:
        """
        Базовый метод создания записи в истории ТМЦ.

        Args:
            item: Объект ТМЦ
            action: Текст действия
            action_type: Тип действия из HistoryAction enum (опционально)
            user: Пользователь (объект User или username)
            comment: Дополнительный комментарий
            location_name: Название локации

        Returns:
            Созданный объект ItemHistory
        """
        location = None
        if location_name:
            location, _ = Location.objects.get_or_create(name=location_name)

        # Определяем username для совместимости
        if hasattr(user, 'username'):
            user_obj = user
        elif user:
            user_obj = None  # FK нельзя создать с username
        else:
            user_obj = None

        return ItemHistory.objects.create(
            item=item,
            action=action,
            action_type=action_type,
            comment=comment,
            user=user_obj,
            location=location,
        )

    # === Явные методы для бизнес-операций ===

    @staticmethod
    def sent_to_service(item: Item, user, reason: str) -> ItemHistory:
        """
        Создаёт запись об отправке ТМЦ в сервис.

        Args:
            item: Объект ТМЦ
            user: Пользователь (объект User)
            reason: Причина отправки в сервис

        Returns:
            Созданный объект ItemHistory
        """
        action_text, action_type = HistoryActionsFormatter.sent_to_service(reason)
        return HistoryService.create(
            item=item,
            action=action_text,
            action_type=action_type,
            user=user,
            location_name=item.location,
        )

    @staticmethod
    def accepted(item: Item, user, location_name: str = None, comment: str = None) -> ItemHistory:
        """
        Создаёт запись о принятии ТМЦ.

        Args:
            item: Объект ТМЦ
            user: Пользователь (объект User)
            location_name: Название локации (опционально)
            comment: Дополнительный комментарий

        Returns:
            Созданный объект ItemHistory
        """
        loc = location_name or item.location
        action_text, action_type = HistoryActionsFormatter.accepted(loc)

        return HistoryService.create(
            item=item,
            action=action_text,
            action_type=action_type,
            user=user,
            comment=comment,
            location_name=loc,
        )

    @staticmethod
    def rejected(item: Item, user, location_name: str = None, comment: str = None) -> ItemHistory:
        """
        Создаёт запись об отклонении ТМЦ.

        Args:
            item: Объект ТМЦ
            user: Пользователь (объект User)
            location_name: Название локации (опционально)
            comment: Дополнительный комментарий

        Returns:
            Созданный объект ItemHistory
        """
        loc = location_name or item.location
        action_text, action_type = HistoryActionsFormatter.rejected(loc)

        return HistoryService.create(
            item=item,
            action=action_text,
            action_type=action_type,
            user=user,
            comment=comment,
            location_name=loc,
        )

    @staticmethod
    def confirmed(item: Item, user, comment: str = None, location_name: str = None) -> ItemHistory:
        """
        Создаёт запись о подтверждении ТМЦ.

        Args:
            item: Объект ТМЦ
            user: Пользователь (объект User)
            comment: Дополнительный комментарий
            location_name: Название локации

        Returns:
            Созданный объект ItemHistory
        """
        action_text, action_type = HistoryActionsFormatter.confirmed(comment)

        return HistoryService.create(
            item=item,
            action=action_text,
            action_type=action_type,
            user=user,
            location_name=location_name or item.location,
        )

    @staticmethod
    def repair_confirmed(item: Item, user, location_name: str = None) -> ItemHistory:
        """
        Создаёт запись о подтверждении ремонта.

        Args:
            item: Объект ТМЦ
            user: Пользователь (объект User)
            location_name: Название локации

        Returns:
            Созданный объект ItemHistory
        """
        action_text, action_type = HistoryActionsFormatter.repair_confirmed()

        return HistoryService.create(
            item=item,
            action=action_text,
            action_type=action_type,
            user=user,
            location_name=location_name or item.location,
        )

    @staticmethod
    def returned_from_service(item: Item, user, location_name: str = None) -> ItemHistory:
        """
        Создаёт запись о возврате из сервиса.

        Args:
            item: Объект ТМЦ
            user: Пользователь (объект User)
            location_name: Название локации

        Returns:
            Созданный объект ItemHistory
        """
        action_text, action_type = HistoryActionsFormatter.returned_from_service()

        return HistoryService.create(
            item=item,
            action=action_text,
            action_type=action_type,
            user=user,
            location_name=location_name or item.location,
        )

    @staticmethod
    def locked(item: Item, user) -> ItemHistory:
        """
        Создаёт запись о блокировке ТМЦ.

        Args:
            item: Объект ТМЦ
            user: Пользователь (объект User)

        Returns:
            Созданный объект ItemHistory
        """
        action_text, action_type = HistoryActionsFormatter.locked(user.username)
        return HistoryService.create(
            item=item,
            action=action_text,
            action_type=action_type,
            user=user,
            location_name=item.location,
        )

    @staticmethod
    def unlocked(item: Item, user) -> ItemHistory:
        """
        Создаёт запись о разблокировке ТМЦ.

        Args:
            item: Объект ТМЦ
            user: Пользователь (объект User)

        Returns:
            Созданный объект ItemHistory
        """
        action_text, action_type = HistoryActionsFormatter.unlocked()
        return HistoryService.create(
            item=item,
            action=action_text,
            action_type=action_type,
            user=user,
            location_name=item.location,
        )

    @staticmethod
    def updated(
        item: Item,
        user,
        comment: str = None,
        location_name: str = None,
        old_status = None,
        new_status = None,
    ) -> ItemHistory:
        """
        Создаёт запись об обновлении информации о ТМЦ.

        Args:
            item: Объект ТМЦ
            user: Пользователь (объект User)
            comment: Комментарий к обновлению
            location_name: Название локации
            old_status: Предыдущий статус
            new_status: Новый статус

        Returns:
            Созданный объект ItemHistory
        """
        if old_status and new_status and old_status != new_status:
            action_text, action_type = HistoryActionsFormatter.status_changed(
                old_status=str(old_status),
                new_status=str(new_status),
            )
        else:
            action_text, action_type = HistoryActionsFormatter.updated(comment)

        return HistoryService.create(
            item=item,
            action=action_text,
            action_type=action_type,
            user=user,
            comment=comment,
            location_name=location_name or item.location,
        )

    @staticmethod
    def get_first_assignment(item: Item):
        """
        Получает первую запись о распределении ТМЦ.

        Args:
            item: Объект ТМЦ

        Returns:
            ItemHistory или None
        """
        return (
            ItemHistory.objects.filter(item=item, action_type=HistoryAction.ASSIGNED)
            .order_by("timestamp")
            .first()
        )

