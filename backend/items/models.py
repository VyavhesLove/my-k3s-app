from django.db import models


class Location(models.Model):
    name = models.TextField(unique=True)

    def __str__(self):
        return self.name

    class Meta:
        verbose_name = 'Локация'
        verbose_name_plural = 'Локации'

class Brigade(models.Model):
    name = models.CharField(max_length=255, unique=True, verbose_name="Название бригады")
    brigadier = models.CharField(max_length=255, verbose_name="Бригадир")
    responsible = models.CharField(max_length=255, verbose_name="Ответственный")

    class Meta:
        verbose_name = 'Бригада'
        verbose_name_plural = 'Бригады'

    def __str__(self):
        return self.name

class Item(models.Model):
    # Статусы из твоего ТЗ
    STATUS_CHOICES = [
        ('at_work', 'В работе'),
        ('in_repair', 'В ремонте'),
        ('issued', 'Выдано'),
        ('available', 'Доступно'),
        ('confirm', 'Подтвердить ТМЦ'),
        ('confirm_repair', 'Подтвердить ремонт'),
    ]

    name = models.CharField(max_length=255, verbose_name="Наименование")
    serial = models.CharField(max_length=100, blank=True, null=True, verbose_name="Серийный номер")
    brand = models.CharField(max_length=100, blank=True, null=True, verbose_name="Бренд")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='available', verbose_name="Статус")
    responsible = models.CharField(max_length=100, blank=True, null=True, verbose_name="Ответственный")
    location = models.CharField(max_length=255, blank=True, null=True, verbose_name="Локация")
    qty = models.IntegerField(default=1, verbose_name="Количество")

    brigade = models.ForeignKey(
        'Brigade', 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        related_name='items',
        verbose_name="Закрепленная бригада"
    )

    class Meta:
        verbose_name = 'ТМЦ'
        verbose_name_plural = 'ТМЦ'

    def __str__(self):
        return f"{self.name} ({self.serial})"

