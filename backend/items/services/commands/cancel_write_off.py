"""Команда отмены списания ТМЦ (CancelWriteOffCommand)."""
from __future__ import annotations

from django.db import transaction
from django.utils import timezone
from items.enums import ItemStatus
from ...models import Item, WriteOffRecord
from ..history_service import HistoryService
from ..domain.item_transitions import ItemTransitions
from ..domain.exceptions import DomainValidationError


class CancelWriteOffCommand:
    """
    Команда отмены списания ТМЦ.

    Отменяет ранее созданную запись о списании и возвращает
    ТМЦ в статус AVAILABLE.

    Требования:
    - Полная транзакционная безопасность (@transaction.atomic)
    - Использование select_for_update() для защиты от race condition
    - Атомарность операции

    Returns:
        int: ID ТМЦ при успешной отмене списания
    """

    @staticmethod
    @transaction.atomic
    def execute(
        item_id: int,
        user = None,
    ) -> int:
        """
        Выполняет отмену списания ТМЦ.

        Алгоритм:
        1. Блокирует Item через select_for_update()
        2. Проверяет статус WRITTEN_OFF
        3. Находит активный WriteOffRecord (is_cancelled=False)
        4. Устанавливает is_cancelled=True, cancelled_at=timezone.now()
        5. Изменяет статус Item → AVAILABLE
        6. Записывает историю
        7. Сохраняет всё в рамках транзакции

        Args:
            item_id: ID ТМЦ для отмены списания
            user: Пользователь (объект User)

        Returns:
            int: ID ТМЦ

        Raises:
            Item.DoesNotExist: Если ТМЦ не найдено
            DomainValidationError: При нарушении бизнес-правил
        """
        # 1. Блокируем Item через select_for_update()
        item = Item.objects.select_for_update().get(id=item_id)

        # 2. Проверяем допустимость отмены списания
        if item.status != ItemStatus.WRITTEN_OFF:
            raise DomainValidationError(
                f"ТМЦ '{item.name}' имеет статус '{item.status}'. "
                f"Отмена списания возможна только для статуса '{ItemStatus.WRITTEN_OFF}'"
            )

        # 3. Находим активную запись о списании
        write_off_record = WriteOffRecord.objects.select_for_update().filter(
            item=item,
            is_cancelled=False
        ).first()

        if not write_off_record:
            raise DomainValidationError(
                f"ТМЦ '{item.name}' не имеет активной записи о списании"
            )

        # 4. Отменяем запись о списании
        write_off_record.is_cancelled = True
        write_off_record.cancelled_at = timezone.now()
        write_off_record.save()

        # 5. Сохраняем старый статус для истории
        old_status = item.status

        # 6. Изменяем статус Item на AVAILABLE
        item.status = ItemStatus.AVAILABLE
        item.save()

        # 7. Записываем в историю - отмена списания
        HistoryService.cancelled_write_off(
            item=item,
            user=user,
            write_off_id=write_off_record.id,
            location=item.location,
        )

        # История смены статуса
        HistoryService.status_changed(
            item=item,
            user=user,
            old_status=old_status,
            new_status=ItemStatus.AVAILABLE,
            location=item.location,
        )

        return item.id

