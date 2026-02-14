# Сервисные ручки (операции со статусом ТМЦ)
from decimal import Decimal
from drf_spectacular.utils import extend_schema
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated

from ..serializers import ItemSerializer, WriteOffSerializer, WriteOffRecordSerializer
from ..models import Item, WriteOffRecord
from ..permissions import IsStorekeeper
from ..services.queries import GetItemQuery
from ..services.commands import (
    SendToServiceCommand, ReturnFromServiceCommand,
    ConfirmItemCommand, ConfirmTMCCommand,
    WriteOffCommand, CancelWriteOffCommand
)
from ..services import DomainValidationError
from ..utils import api_response


@extend_schema(request=None, responses=ItemSerializer)
@api_view(['POST'])
def send_to_service(request, item_id):
    """Отправить ТМЦ в сервис"""
    item_id = SendToServiceCommand.execute(
        item_id=item_id,
        reason=request.data.get("reason", ""),
        user=request.user
    )
    item = GetItemQuery.by_id(item_id)
    return api_response(
        data=ItemSerializer(item).data,
        message="ТМЦ отправлено в сервис"
    )


@extend_schema(request=None, responses=ItemSerializer)
@api_view(['POST'])
def return_from_service(request, item_id):
    """Вернуть ТМЦ из сервиса"""
    item_id = ReturnFromServiceCommand.execute(
        item_id=item_id,
        action="return",
        user=request.user
    )
    item = GetItemQuery.by_id(item_id)
    return api_response(
        data=ItemSerializer(item).data,
        message="ТМЦ возвращено из сервиса"
    )


@extend_schema(request=None, responses=ItemSerializer)
@api_view(['POST'])
def confirm_repair(request, item_id):
    """
    Подтверждение начала ремонта (confirm_repair → in_repair).
    """
    item_id = ReturnFromServiceCommand.execute(
        item_id=item_id,
        action="confirm_repair",
        user=request.user
    )
    item = GetItemQuery.by_id(item_id)
    return api_response(
        data=ItemSerializer(item).data,
        message="Ремонт подтвержден"
    )


@extend_schema(request=None, responses=ItemSerializer)
@api_view(['POST'])
def write_off_from_confirm_repair(request, item_id):
    """
    Списание ТМЦ из статуса "Подтвердить ремонт" (confirm_repair → written_off).
    """
    item_id = ReturnFromServiceCommand.execute(
        item_id=item_id,
        action="write_off",
        user=request.user
    )
    item = GetItemQuery.by_id(item_id)
    return api_response(
        data=ItemSerializer(item).data,
        message="ТМЦ списано"
    )


@extend_schema(request=None, responses=ItemSerializer)
@api_view(['POST'])
@permission_classes([IsStorekeeper])
def confirm_item(request, item_id):
    """
    Подтвердить ТМЦ (статус confirm -> available).
    Permission: только кладовщик или администратор.
    """
    comment = request.data.get('comment', '')
    item_id = ConfirmItemCommand.execute(
        item_id=item_id,
        comment=comment,
        user=request.user
    )
    item = GetItemQuery.by_id(item_id)
    return api_response(
        data=ItemSerializer(item).data,
        message="ТМЦ подтверждено"
    )


@extend_schema(request=None, responses=ItemSerializer)
@api_view(['POST'])
def write_off_item(request, item_id):
    """
    Списание ТМЦ.
    Создаёт запись о списании и переводит ТМЦ в статус written_off.
    """
    serializer = WriteOffSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    item_id, write_off_id = WriteOffCommand.execute(
        item_id=item_id,
        invoice_number=serializer.validated_data["invoice_number"],
        repair_cost=serializer.validated_data.get("repair_cost", Decimal("0")),
        date_to_service=serializer.validated_data.get("date_to_service"),
        date_written_off=serializer.validated_data.get("date_written_off"),
        description=serializer.validated_data.get("description", ""),
        user=request.user
    )

    write_off_record = WriteOffRecord.objects.select_related('item', 'location', 'created_by').get(id=write_off_id)
    return api_response(
        data=WriteOffRecordSerializer(write_off_record).data,
        message="ТМЦ списано",
        status_code=201
    )


@extend_schema(request=None, responses=ItemSerializer)
@api_view(['POST'])
def cancel_write_off_item(request, item_id):
    """
    Отмена списания ТМЦ.
    Возвращает ТМЦ в статус available и отменяет запись о списании.
    """
    item_id = CancelWriteOffCommand.execute(
        item_id=item_id,
        user=request.user
    )
    item = GetItemQuery.by_id(item_id)
    return api_response(
        data=ItemSerializer(item).data,
        message="Списание отменено"
    )

