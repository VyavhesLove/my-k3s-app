"""Команда обновления данных ТМЦ."""
from __future__ import annotations

from django.db import transaction
from ...models import Item
from ..history_service import HistoryService
from ..domain.item_transitions import ItemTransitions
from ..domain.exceptions import DomainValidationError


class UpdateItemCommand:
    """
    Команда обновления данных ТМЦ.

    Требования:
    - Полная транзакционная безопасность (@transaction.atomic)
    - Использование select_for_update() для защиты от race condition
    - Без использования LockService

    Command — изменяет состояние системы.
    Returns:
        int: ID изменённого ТМЦ
    """

    @staticmethod
    @transaction.atomic
    def execute(item_id: int, data: dict, user) -> int:
        """
        Обновляет данные ТМЦ.

        Args:
            item_id: ID ТМЦ
            data: Словарь с полями для обновления
            user: Пользователь (объект User)

        Returns:
            int: ID изменённого ТМЦ

        Raises:
            ValueError: При ошибках валидации
        """
        # 1. Блокируем строку через select_for_update()
        item = Item.objects.select_for_update().get(id=item_id)

        old_status = item.status
        service_comment = data.pop("service_comment", None)

        # 2. Валидируем переход статуса, если статус изменяется
        new_status = data.get("status")
        new_status_for_compare = None  # Сохраняем для последующего сравнения
        
        if new_status:
            # Конвертируем в строку для корректного сравнения
            old_status_str = str(old_status) if old_status else None
            new_status_str = str(new_status) if new_status else None
            
            if new_status_str and new_status_str != old_status_str:
                # Импортируем здесь, чтобы избежать циклического импорта
                from items.enums import ItemStatus
                
                # Конвертируем строку в enum
                try:
                    new_status_enum = ItemStatus(new_status_str)
                    new_status_for_compare = new_status_enum
                except ValueError:
                    raise DomainValidationError(f"Недопустимый статус: {new_status_str}")
                
                # Валидируем переход
                ItemTransitions.validate_transition(old_status, new_status_enum)

        # 3. Обновляем поля
        # Особые случаи для полей с ForeignKey
        brigade_id = data.pop('brigade', None)
        
        for field, value in data.items():
            if hasattr(item, field):
                # Если обновляется статус и мы его валидировали - используем enum
                if field == 'status' and new_status_for_compare:
                    setattr(item, field, new_status_for_compare)
                else:
                    setattr(item, field, value)
        
        # Обрабатываем brigade отдельно - нужно преобразовать ID в объект Brigade
        if brigade_id is not None:
            from items.models import Brigade
            if brigade_id == '' or brigade_id is False:
                # Пустое значение или false - сбрасываем связь
                item.brigade = None
            else:
                try:
                    brigade_id_int = int(brigade_id)
                    item.brigade = Brigade.objects.get(id=brigade_id_int)
                except (ValueError, Brigade.DoesNotExist):
                    # Если не удалось преобразовать - оставляем как есть
                    pass

        item.save()

        # 4. Записываем в историю если есть комментарий или изменился статус
        # Примечание: для передачи в историю статус должен быть строкой (ItemStatus.value),
        # так как HistoryActionTemplates.format() ожидает строковые значения
        if service_comment or (new_status_for_compare and old_status != item.status):
            # Используем status_changed для записи смены статуса
            HistoryService.status_changed(
                item=item,
                user=user,
                old_status=str(old_status) if old_status else None,  # преобразуем enum в строку для истории
                new_status=str(item.status),  # преобразуем enum в строку для истории
                location=item.location,
            )
            # Также записываем обновление с комментарием если есть
            if service_comment:
                HistoryService.updated(
                    item=item,
                    user=user,
                    comment=service_comment,
                    location=item.location,
                )

        return item.id
