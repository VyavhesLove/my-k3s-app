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

class HistorySerializer(serializers.ModelSerializer):
    date = serializers.DateTimeField(source='timestamp', format="%d.%m.%y")
    class Meta:
        model = ItemHistory
        fields = ['date', 'action', 'user']

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

    class Meta:
        model = Item
        # Добавляем историю и детали в общий список полей
        fields = [
            'id', 'name', 'serial', 'brand', 'status', 'responsible', 
            'location', 'qty', 'brigade', 'brigade_details', 'history'
        ]