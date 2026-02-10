from django.db import transaction
from django.utils import timezone
from .models import Item, ItemHistory, Location
from .enums import ItemStatus

class ConfirmTMCService:

    @staticmethod
    @transaction.atomic
    def process(item_id, action, user):
        """
        Единая точка входа для подтверждения/отклонения ТМЦ.
        select_for_update() работает внутри транзакции — блокировка гарантирована.
        """
        item = Item.objects.select_for_update().get(pk=item_id)

        if action == "accept":
            ConfirmTMCService._accept(item, user)
        else:
            ConfirmTMCService._reject(item, user)

    @staticmethod
    def _accept(item: Item, user):
        """Внутренний метод — вызывается внутри транзакции"""
        if item.status != ItemStatus.CONFIRM:
            raise ValueError("ТМЦ не требует подтверждения")

        item.status = ItemStatus.ISSUED
        item.responsible = user.username if hasattr(user, 'username') else str(user)
        item.save()

        # Получаем Location объект для истории
        location_obj = None
        if item.location:
            location_obj, _ = Location.objects.get_or_create(name=item.location)

        ItemHistory.objects.create(
            item=item,
            user=user,
            location=location_obj,
            action=f"ТМЦ принято. Объект - {item.location}"
        )

    @staticmethod
    def _reject(item: Item, user):
        """
        Отклонение ТМЦ — возврат на исходную локацию ответственному.
        Структурированные данные берём из первой записи истории.
        """
        # первая операция = распределение
        first_operation = (
            ItemHistory.objects
            .filter(item=item, action="assigned")
            .order_by("timestamp")
            .first()
        )

        if not first_operation:
            raise ValueError("Невозможно восстановить исходное состояние")

        # Восстанавливаем из структурированных данных
        item.status = ItemStatus.ISSUED
        item.location = first_operation.location.name if first_operation.location else item.location
        # first_operation.user это FK (объект User)
        # Если FK существует, берём username, иначе None
        item.responsible = first_operation.user.username if first_operation.user else None

        item.save()

        ItemHistory.objects.create(
            item=item,
            user=user,
            location=first_operation.location,
            action=f"ТМЦ не принято. Возвращено на объект - {item.location}"
        )


class ItemLockService:
    @staticmethod
    @transaction.atomic
    def lock_item(item_id, user):  # user = request.user (объект!)
        item = Item.objects.select_for_update().get(id=item_id)
        
        if item.locked_by and item.locked_by != user:  # Сравниваем объекты!
            raise ValueError(f"ТМЦ заблокировано пользователем: {item.locked_by.username}")
            
        item.locked_by = user  # ✅ User instance!
        item.locked_at = timezone.now()
        item.save()
        
        # Получаем Location объект
        location_obj = None
        if item.location:
            location_obj, _ = Location.objects.get_or_create(name=item.location)
        
        ItemHistory.objects.create(
            item=item,
            action=f"Заблокировано: {user.username}",
            user=user,
            location=location_obj
        )
        return item

    @staticmethod
    @transaction.atomic
    def unlock_item(item_id, user):  # user = request.user
        item = Item.objects.select_for_update().get(id=item_id)
        
        if item.locked_by and item.locked_by != user:
            raise ValueError("Нет прав на разблокировку")
            
        item.locked_by = None
        item.locked_at = None
        item.save()


class ItemServiceService:
    @staticmethod
    @transaction.atomic  # 🔐 Всё или ничего!
    def send_to_service(item_id, reason, user):
        """Отправка в сервис (с проверкой БЛОКИРОВКИ!)"""
        item = ItemLockService.lock_item(item_id, user)  # ✅ ПРОВЕРКА!
        
        try:
            # Твоя логика
            if item.brigade:
                item.brigade = None
            item.status = ItemStatus.IN_REPAIR
            item.save()
            
            # Получаем Location объект
            location_obj = None
            if item.location:
                location_obj, _ = Location.objects.get_or_create(name=item.location)
            
            ItemHistory.objects.create(
                item=item,
                action=f"Отправлено в сервис. Причина: {reason}",
                user=user,
                location=location_obj
            )
            return item
            
        finally:
            ItemLockService.unlock_item(item_id, user)  # ✅ РАЗБЛОКИРОВКА
