from rest_framework import serializers
from .models import Item, Location


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

