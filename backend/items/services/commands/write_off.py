"""Команда списания ТМЦ (WriteOffCommand)."""
from __future__ import annotations

from datetime import date
from decimal import Decimal
from django.db import transaction
from items.enums import ItemStatus
from ...models import Item, WriteOffRecord, Location
from ..history_service import HistoryService
from ..domain.item_transitions import ItemTransitions
from ..domain.exceptions import DomainValidationError, DomainConflictError


class WriteOffCommand:
    """
    Команда списания ТМЦ.

    Создаёт бухгалтерски значимую запись о списании и переводит
    ТМЦ в статус WRITTEN_OFF.

    Требования:
    - Полная транзакционная безопасность (@transaction.atomic)
    - Использование select_for_update() для защиты от race condition
    - Без использования LockService

    Returns:
        tuple: (item_id, write_off_record_id) при успешном списании
    """

    @staticmethod
    @transaction.atomic
    def execute(
        item_id: int,
        invoice_number: str,
        repair_cost: Decimal = Decimal("0"),
        date_to_service: date = None,
        date_written_off: date = None,
        description: str = "",
        user = None,
    ) -> tuple[int, int]:
        """
        Выполняет списание ТМЦ.

        Args:
            item_id: ID ТМЦ для списания
            invoice_number: Номер накладной (обязательно)
            repair_cost: Стоимость ремонта/списания (по умолчанию 0)
            date_to_service: Дата поступления в ремонт (по умолчанию текущая)
            date_written_off: Дата списания (по умолчанию текущая)
            description: Описание причины списания (не обязательно)
            user: Пользователь (объект User)

        Returns:
            tuple[int, int]: (item_id, write_off_record_id)

        Raises:
            Item.DoesNotExist: Если ТМЦ не найдено
            DomainValidationError: При нарушении бизнес-правил
        """
        # 1. Получаем Item через select_for_update() - блокируем строку
        item = Item.objects.select_for_update().get(id=item_id)

        # 2. Проверяем, что Item ещё не списан (конфликт состояния)
        if item.status == ItemStatus.WRITTEN_OFF:
            raise DomainConflictError("Item уже списан")

        # 3. Проверяем допустимость списания из текущего статуса
        ItemTransitions.validate_write_off(item.status)

        # 5. Проверяем, что нет активной записи списания
        if WriteOffRecord.objects.filter(item=item, is_cancelled=False).exists():
            raise DomainValidationError(
                f"ТМЦ '{item.name}' уже имеет активную запись о списании"
            )

        # 6. Определяем даты
        today = date.today()
        effective_date_to_service = date_to_service or today
        effective_date_written_off = date_written_off or today

        # 7. Получаем или создаём Location для списания
        location = None
        if item.location:
            location, _ = Location.objects.get_or_create(name=item.location)

        # 9. Создаём запись о списании
        write_off_record = WriteOffRecord.objects.create(
            item=item,
            location=location,
            repair_cost=repair_cost,
            invoice_number=invoice_number,
            description=description,
            date_to_service=effective_date_to_service,
            date_written_off=effective_date_written_off,
            created_by=user,
        )

        # 10. Обновляем статус Item на WRITTEN_OFF
        old_status = item.status
        item.status = ItemStatus.WRITTEN_OFF
        item.save()

        # 11. Записываем в историю списания
        HistoryService.written_off(
            item=item,
            user=user,
            reason=description,
            amount=repair_cost,
            location=item.location,
        )

        # 12. История смены статуса
        HistoryService.status_changed(
            item=item,
            user=user,
            old_status=old_status,
            new_status=ItemStatus.WRITTEN_OFF,
            location=item.location,
        )

        return item.id, write_off_record.id

