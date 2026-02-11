"""Централизованный сервис для создания записей истории."""
from django.db import models
from ..models import Item, ItemHistory, Location
from ..enums import HistoryAction


class HistoryService:
    """Сервис для работы с историей ТМЦ."""

    @staticmethod
    def create(
        item: Item,
        action_type: HistoryAction,
        payload: dict = None,
        user=None,
        comment: str = None,
        location_name: str = None,
        generate_action: bool = True,
    ) -> ItemHistory:
        """
        Базовый метод создания записи в истории ТМЦ.

        Args:
            item: Объект ТМЦ
            action_type: Тип действия из HistoryAction enum
            payload: Параметры для генерации текста действия
            user: Пользователь (объект User или username)
            comment: Дополнительный комментарий
            location_name: Название локации
            generate_action: Генерировать ли текст действия из payload

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

        # Генерируем текст действия из payload
        action = None
        if generate_action and action_type:
            action = action_type.format(payload)

        return ItemHistory.objects.create(
            item=item,
            action=action,
            action_type=action_type.value if action_type else None,
            payload=payload,
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
        payload = {"reason": reason}
        return HistoryService.create(
            item=item,
            action_type=HistoryAction.SENT_TO_SERVICE,
            payload=payload,
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
        payload = {"location": loc} if loc else None

        return HistoryService.create(
            item=item,
            action_type=HistoryAction.ACCEPTED,
            payload=payload,
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
        payload = {"location": loc} if loc else None

        return HistoryService.create(
            item=item,
            action_type=HistoryAction.REJECTED,
            payload=payload,
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
        payload = {"comment": comment} if comment else None

        return HistoryService.create(
            item=item,
            action_type=HistoryAction.CONFIRMED,
            payload=payload,
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
        return HistoryService.create(
            item=item,
            action_type=HistoryAction.REPAIR_CONFIRMED,
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
        return HistoryService.create(
            item=item,
            action_type=HistoryAction.RETURNED_FROM_SERVICE,
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
        payload = {"username": user.username}
        return HistoryService.create(
            item=item,
            action_type=HistoryAction.LOCKED,
            payload=payload,
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
        return HistoryService.create(
            item=item,
            action_type=HistoryAction.UNLOCKED,
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
            action_type = HistoryAction.STATUS_CHANGED
            payload = {"old_status": str(old_status), "new_status": str(new_status)}
        else:
            action_type = HistoryAction.UPDATED
            payload = {"comment": comment} if comment else None

        return HistoryService.create(
            item=item,
            action_type=action_type,
            payload=payload,
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
            ItemHistory.objects.filter(item=item, action_type=HistoryAction.ASSIGNED.value)
            .order_by("timestamp")
            .first()
        )

