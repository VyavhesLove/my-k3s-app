from django.db import transaction
from ..models import ItemHistory, Location
from ..enums import HistoryAction


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
        location_value = location or item.location
        action_type, action_text, payload = HistoryAction.ACCEPTED.build(location=location_value)
        return HistoryService._create_with_payload(
            item, action_type, user, location_value, payload
        )
    
    @staticmethod
    def rejected(item, user, location=None):
        """ТМЦ отклонено"""
        location_value = location or item.location
        action_type, action_text, payload = HistoryAction.REJECTED.build(location=location_value)
        return HistoryService._create_with_payload(
            item, action_type, user, location_value, payload
        )
    
    @staticmethod
    def sent_to_service(item, user, reason, location=None):
        """Отправлено в сервис"""
        action_type, action_text, payload = HistoryAction.SENT_TO_SERVICE.build(reason=reason)
        return HistoryService._create_with_payload(
            item, action_type, user, location or item.location, payload
        )
    
    @staticmethod
    def returned_from_service(item, user, location=None):
        """Возвращено из сервиса"""
        action_type, action_text, payload = HistoryAction.RETURNED_FROM_SERVICE.build()
        return HistoryService._create_with_payload(
            item, action_type, user, location or item.location, payload
        )
    
    @staticmethod
    def status_changed(item, user, old_status, new_status, location=None):
        """Смена статуса"""
        action_type, action_text, payload = HistoryAction.STATUS_CHANGED.build(
            old_status=old_status, new_status=new_status
        )
        return HistoryService._create_with_payload(
            item, action_type, user, location or item.location, payload
        )
    
    @staticmethod
    def locked(item, user, location=None):
        """ТМЦ заблокировано"""
        action_type, action_text, payload = HistoryAction.LOCKED.build(username=user.username)
        return HistoryService._create_with_payload(
            item, action_type, user, location or item.location, payload
        )
    
    @staticmethod
    def updated(item, user, comment=None, location=None):
        """Обновление информации"""
        action_type, action_text, payload = HistoryAction.UPDATED.build(comment=comment)
        return HistoryService._create_with_payload(
            item, action_type, user, location or item.location, payload, comment
        )
    
    @staticmethod
    def assigned(item, user, location=None):
        """ТМЦ распределено"""
        action_type, action_text, payload = HistoryAction.ASSIGNED.build(location=location or item.location)
        return HistoryService._create_with_payload(
            item, action_type, user, location, payload
        )
    
    @staticmethod
    def repair_confirmed(item, user, location=None):
        """Ремонт подтверждён"""
        action_type, action_text, payload = HistoryAction.REPAIR_CONFIRMED.build()
        return HistoryService._create_with_payload(
            item, action_type, user, location or item.location, payload
        )
    
    @staticmethod
    def unlocked(item, user, location=None):
        """ТМЦ разблокировано"""
        action_type, action_text, payload = HistoryAction.UNLOCKED.build()
        return HistoryService._create_with_payload(
            item, action_type, user, location or item.location, payload
        )
    
    @staticmethod
    def confirmed(item, user, comment=None, location=None):
        """ТМЦ подтверждено"""
        action_type, action_text, payload = HistoryAction.CONFIRMED.build(comment=comment)
        return HistoryService._create_with_payload(
            item, action_type, user, location or item.location, payload, comment
        )
    
    @staticmethod
    def written_off(item, user, reason=None, amount=None, location=None):
        """ТМЦ списано"""
        payload = {}
        if reason:
            payload['reason'] = reason
        if amount is not None:
            payload['amount'] = str(amount)
        
        action_type, action_text, action_payload = HistoryAction.WRITTEN_OFF.build(**payload)
        return HistoryService._create_with_payload(
            item, action_type, user, location or item.location, action_payload
        )
    
    @staticmethod
    def cancelled_write_off(item, user, write_off_id=None, location=None):
        """Отмена списания ТМЦ"""
        payload = {}
        if write_off_id:
            payload['write_off_id'] = str(write_off_id)
        
        action_type, action_text, action_payload = HistoryAction.CANCELLED_WRITE_OFF.build(**payload)
        return HistoryService._create_with_payload(
            item, action_type, user, location or item.location, action_payload
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

