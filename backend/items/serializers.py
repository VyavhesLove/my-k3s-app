from rest_framework import serializers
from .models import Item, Location, Brigade


class ItemSerializer(serializers.ModelSerializer):
    """Сериализатор для модели ТМЦ"""
    class Meta:
        model = Item
        fields = '__all__'


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

