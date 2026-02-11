from django.db import transaction
from ..models import ItemHistory, Location
from ..enums import HistoryAction
from .domain.history_actions import (
    create_accepted, create_rejected, create_sent_to_service,
    create_returned_from_service, create_status_changed,
    create_locked, create_updated, create_assigned,
    create_repair_confirmed, create_unlocked, create_confirmed
)


class HistoryService:
    """Семантический сервис для создания записей истории"""
    
    @staticmethod
    def create(item, action_type, user=None, location_name=None, payload=None, comment=None):
        """Общий метод для создания истории"""
        location = None
        if location_name:
            location, _ = Location.objects.get_or_create(name=location_name)
        
        # Генерируем полный текст действия
        from ..enums import HistoryActionTemplates
        action_text = HistoryActionTemplates.format(action_type, payload)
        
        return ItemHistory.objects.create(
            item=item,
            action=action_text,
            action_type=action_type,
            payload=payload or {},
            comment=comment,
            user=user,
            location=location
        )
    
    @staticmethod
    def accepted(item, user, location=None):
        """ТМЦ принято"""
        action_type, action_text, payload = create_accepted(location or item.location)
        return HistoryService._create_with_payload(
            item, action_type, user, location, payload
        )
    
    @staticmethod
    def rejected(item, user, location=None):
        """ТМЦ отклонено"""
        action_type, action_text, payload = create_rejected(location or item.location)
        return HistoryService._create_with_payload(
            item, action_type, user, location, payload
        )
    
    @staticmethod
    def sent_to_service(item, user, reason, location=None):
        """Отправлено в сервис"""
        action_type, action_text, payload = create_sent_to_service(reason)
        return HistoryService._create_with_payload(
            item, action_type, user, location or item.location, payload
        )
    
    @staticmethod
    def returned_from_service(item, user, location=None):
        """Возвращено из сервиса"""
        action_type, action_text, payload = create_returned_from_service()
        return HistoryService._create_with_payload(
            item, action_type, user, location or item.location, payload
        )
    
    @staticmethod
    def status_changed(item, user, old_status, new_status, location=None):
        """Смена статуса"""
        action_type, action_text, payload = create_status_changed(old_status, new_status)
        return HistoryService._create_with_payload(
            item, action_type, user, location or item.location, payload
        )
    
    @staticmethod
    def locked(item, user, location=None):
        """ТМЦ заблокировано"""
        action_type, action_text, payload = create_locked(user.username)
        return HistoryService._create_with_payload(
            item, action_type, user, location or item.location, payload
        )
    
    @staticmethod
    def updated(item, user, comment=None, location=None):
        """Обновление информации"""
        action_type, action_text, payload = create_updated(comment)
        return HistoryService._create_with_payload(
            item, action_type, user, location or item.location, payload, comment
        )
    
    @staticmethod
    def assigned(item, user, location=None):
        """ТМЦ распределено"""
        action_type, action_text, payload = create_assigned(location or item.location)
        return HistoryService._create_with_payload(
            item, action_type, user, location, payload
        )
    
    @staticmethod
    def repair_confirmed(item, user, location=None):
        """Ремонт подтверждён"""
        action_type, action_text, payload = create_repair_confirmed()
        return HistoryService._create_with_payload(
            item, action_type, user, location or item.location, payload
        )
    
    @staticmethod
    def unlocked(item, user, location=None):
        """ТМЦ разблокировано"""
        action_type, action_text, payload = create_unlocked()
        return HistoryService._create_with_payload(
            item, action_type, user, location or item.location, payload
        )
    
    @staticmethod
    def confirmed(item, user, comment=None, location=None):
        """ТМЦ подтверждено"""
        action_type, action_text, payload = create_confirmed(comment)
        return HistoryService._create_with_payload(
            item, action_type, user, location or item.location, payload, comment
        )
    
    @staticmethod
    def _create_with_payload(item, action_type, user, location_name, payload, comment=None):
        """Вспомогательный метод для создания истории с payload"""
        location_obj = None
        if location_name:
            location_obj, _ = Location.objects.get_or_create(name=location_name)
        
        # Генерируем полный текст действия
        from ..enums import HistoryActionTemplates
        action_text = HistoryActionTemplates.format(action_type, payload)
        
        return ItemHistory.objects.create(
            item=item,
            action=action_text,
            action_type=action_type,
            payload=payload,
            comment=comment,
            user=user,
            location=location_obj
        )

    @staticmethod
    def get_first_assignment(item):
        """
        Получает первую запись о распределении ТМЦ.

        Args:
            item: Объект ТМЦ

        Returns:
            ItemHistory или None
        """
        # TODO: Если поиск по точному совпадению не работает, заменить на:
        # action__icontains=HistoryAction.ASSIGNED.value
        # (поиск по частичному совпадению в поле action)
        return (
            ItemHistory.objects.filter(item=item, action_type=HistoryAction.ASSIGNED.value)
            .order_by("timestamp")
            .first()
        )

