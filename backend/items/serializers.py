from rest_framework import serializers
from .models import Item, Location, Brigade, ItemHistory


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
    date = serializers.DateTimeField(source='timestamp', format="%d.%m.%y")
    user_username = serializers.SerializerMethodField()

    class Meta:
        model = ItemHistory
        fields = ['id', 'date', 'action', 'comment', 'user', 'user_username', 'location']

    def get_user_username(self, obj):
        """Возвращает username пользователя, если FK существует"""
        if obj.user:
            return obj.user.username
        return None


class HistorySerializer(ItemHistorySerializer):
    """Алиас для обратной совместимости"""
    pass

class ItemSerializer(serializers.ModelSerializer):
    # Для отображения истории и деталей бригады (ReadOnly)
    history = HistorySerializer(many=True, read_only=True)
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
