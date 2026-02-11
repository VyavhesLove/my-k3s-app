from django.db import transaction
from django.utils import timezone
from .models import Item, Location
from .enums import ItemStatus
from .serializers import ItemSerializer


class HistoryService:
    """Централизованный сервис для создания записей истории"""
    @staticmethod
    def create(item, action, user=None, comment=None, location_name=None):
        location = None
        if location_name:
            location, _ = Location.objects.get_or_create(name=location_name)

        return ItemHistory.objects.create(
            item=item,
            action=action,
            comment=comment,
            user=user,
            location=location
        )


class ConfirmTMCService:
    from .services.domain.exceptions import DomainValidationError

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
            raise DomainValidationError("ТМЦ не требует подтверждения")

        item.status = ItemStatus.ISSUED
        item.responsible = user.username if hasattr(user, 'username') else str(user)
        item.save()

        HistoryService.create(
            item=item,
            action=f"ТМЦ принято. Объект - {item.location}",
            user=user,
            location_name=item.location
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
            raise DomainValidationError("Невозможно восстановить исходное состояние")

        # Восстанавливаем из структурированных данных
        item.status = ItemStatus.ISSUED
        item.location = first_operation.location.name if first_operation.location else item.location
        # first_operation.user это FK (объект User)
        # Если FK существует, берём username, иначе None
        item.responsible = first_operation.user.username if first_operation.user else None

        item.save()

        HistoryService.create(
            item=item,
            action=f"ТМЦ не принято. Возвращено на объект - {item.location}",
            user=user,
            location_name=first_operation.location.name if first_operation.location else None
        )


class ItemLockService:
    from .services.domain.exceptions import DomainConflictError

    @staticmethod
    @transaction.atomic
    def lock_item(item_id, user):  # user = request.user (объект!)
        item = Item.objects.select_for_update().get(id=item_id)
        
        if item.locked_by and item.locked_by != user:  # Сравниваем объекты!
            raise DomainConflictError(f"ТМЦ заблокировано пользователем: {item.locked_by.username}")
            
        item.locked_by = user  # ✅ User instance!
        item.locked_at = timezone.now()
        item.save()
        
        HistoryService.create(
            item=item,
            action=f"Заблокировано: {user.username}",
            user=user,
            location_name=item.location
        )
        return item

    @staticmethod
    @transaction.atomic
    def unlock_item(item_id, user):  # user = request.user
        item = Item.objects.select_for_update().get(id=item_id)
        
        if item.locked_by and item.locked_by != user:
            raise DomainConflictError("Нет прав на разблокировку")
            
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
            
            HistoryService.create(
                item=item,
                action=f"Отправлено в сервис. Причина: {reason}. Ожидание подтверждения.",
                user=user,
                location_name=item.location
            )
            return item
            
        finally:
            ItemLockService.unlock_item(item_id, user)  # ✅ РАЗБЛОКИРОВКА

class ItemWorkflowService:
    @staticmethod
    @transaction.atomic
    def change_status(item_id, new_status, action, user, location_name=None, comment=None):
        item = Item.objects.select_for_update().get(id=item_id)

        item.status = new_status
        item.save()

        HistoryService.create(
            item=item,
            action=action,
            user=user,
            location_name=location_name or item.location,
            comment=comment
        )

        return item

class ItemUpdateService:
    @staticmethod
    @transaction.atomic
    def update(item_id, data, user):
        item = ItemLockService.lock_item(item_id, user)

        try:
            old_status = item.status

            serializer = ItemSerializer(item, data=data, partial=True)
            serializer.is_valid(raise_exception=True)
            item = serializer.save()

            comment = data.get("service_comment")
            if comment:
                action = (
                    f"Смена статуса: {old_status} → {item.status}"
                    if old_status != item.status
                    else "Обновление информации"
                )

                HistoryService.create(
                    item=item,
                    action=action,
                    comment=comment,
                    user=user,
                    location_name=item.location
                )

            return item
        finally:
            ItemLockService.unlock_item(item_id, user)

