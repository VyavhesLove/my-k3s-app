from decimal import Decimal
from rest_framework import serializers
from .models import Item, Location, Brigade, ItemHistory, WriteOffRecord


# class ItemSerializer(serializers.ModelSerializer):
#     """Сериализатор для модели ТМЦ"""
#     class Meta:
#         model = Item
#         fields = '__all__'


class LocationSerializer(serializers.ModelSerializer):
    """Сериализатор для локаций"""
    class Meta:
        model = Location
        fields = ['id', 'name']


class StatusCounterSerializer(serializers.Serializer):
    """Схема для счетчиков уведомлений"""
    to_receive = serializers.IntegerField()
    to_repair = serializers.IntegerField()
    issued = serializers.IntegerField()


class BrigadeSerializer(serializers.ModelSerializer):
    """Сериализатор для бригад"""
    
    items = serializers.PrimaryKeyRelatedField(many=True, read_only=True)

    class Meta:
        model = Brigade
        fields = ['id', 'name', 'brigadier', 'responsible', 'items']

class ItemHistorySerializer(serializers.ModelSerializer):
    """Сериализатор для истории ТМЦ"""
    date = serializers.DateTimeField(source='timestamp', format="%d.%m.%y %H:%M")
    user_username = serializers.SerializerMethodField()
    action_type_display = serializers.CharField(source='get_action_type_display', read_only=True)

    class Meta:
        model = ItemHistory
        fields = ['id', 'date', 'action', 'action_type', 'action_type_display', 'comment', 'user', 'user_username', 'location']

    def get_user_username(self, obj):
        """Возвращает username пользователя, если FK существует"""
        if obj.user:
            return obj.user.username
        return None


class ItemSerializer(serializers.ModelSerializer):
    # Для отображения истории и деталей бригады (ReadOnly)
    history = ItemHistorySerializer(many=True, read_only=True)
    brigade_details = BrigadeSerializer(source='brigade', read_only=True)

    # Для записи (принимает ID бригады)
    brigade = serializers.PrimaryKeyRelatedField(
        queryset=Brigade.objects.all(),
        write_only=True,
        required=False,
        allow_null=True
    )

    # Комментарий для сервисных операций (write_only, не сохраняется в модель)
    service_comment = serializers.CharField(write_only=True, required=False, allow_blank=True)

    class Meta:
        model = Item
        # Добавляем историю, детали и service_comment в общий список полей
        fields = [
            'id', 'name', 'serial', 'brand', 'status', 'responsible',
            'location', 'qty', 'brigade', 'brigade_details', 'history',
            'service_comment',
            # Поля блокировки
            'locked_by', 'locked_at'
        ]
        read_only_fields = ['locked_by', 'locked_at']


class ConfirmTMCSerializer(serializers.Serializer):
    action = serializers.ChoiceField(choices=["accept", "reject"])


class WriteOffSerializer(serializers.Serializer):
    """Сериализатор для запроса списания ТМЦ"""
    invoice_number = serializers.CharField(max_length=255)
    repair_cost = serializers.DecimalField(max_digits=12, decimal_places=2, default=Decimal("0"))
    date_to_service = serializers.DateField(required=False)
    date_written_off = serializers.DateField(required=False)
    description = serializers.CharField(required=False, allow_blank=True)


class WriteOffCreateSerializer(serializers.Serializer):
    """
    Сериализатор для создания записи о списании ТМЦ через API.
    
    Используется в POST /writeoffs/ endpoint.
    """
    item_id = serializers.IntegerField(
        help_text="ID ТМЦ для списания"
    )
    invoice_number = serializers.CharField(
        max_length=255,
        help_text="Номер накладной"
    )
    repair_cost = serializers.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal("0"),
        help_text="Стоимость ремонта/списания"
    )
    date_to_service = serializers.DateField(
        required=False,
        help_text="Дата поступления в ремонт"
    )
    date_written_off = serializers.DateField(
        required=False,
        help_text="Дата списания"
    )
    description = serializers.CharField(
        required=False,
        allow_blank=True,
        help_text="Описание причины списания"
    )


class WriteOffRecordSerializer(serializers.ModelSerializer):
    """Сериализатор для записи о списании ТМЦ"""
    item_name = serializers.CharField(source='item.name', read_only=True)
    item_serial = serializers.CharField(source='item.serial', read_only=True)
    location_name = serializers.SerializerMethodField()
    created_by_username = serializers.SerializerMethodField()

    class Meta:
        model = WriteOffRecord
        fields = [
            'id', 'item', 'item_name', 'item_serial', 'location', 'location_name',
            'repair_cost', 'invoice_number', 'description',
            'date_to_service', 'date_written_off',
            'created_by', 'created_by_username', 'created_at',
            'is_cancelled', 'cancelled_at'
        ]
        read_only_fields = ["id", "created_at", "cancelled_at", "is_cancelled", "created_by"]

    def get_location_name(self, obj):
        """Возвращает название локации, если FK существует"""
        if obj.location:
            return obj.location.name
        return None

    def get_created_by_username(self, obj):
        """Возвращает username создателя записи"""
        if obj.created_by:
            return obj.created_by.username
        return None

