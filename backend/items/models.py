from django.conf import settings
from django.db import models
from .enums import ItemStatus, HistoryAction


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
    name = models.CharField(max_length=255, verbose_name="Наименование")
    serial = models.CharField(max_length=100, blank=True, null=True, verbose_name="Серийный номер")
    brand = models.CharField(max_length=100, blank=True, null=True, verbose_name="Бренд")
    status = models.CharField(max_length=20, choices=ItemStatus.choices, default=ItemStatus.AVAILABLE, verbose_name="Статус")
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

    # Поля для блокировки ТМЦ (чтобы 2 пользователя не работали одновременно)
    locked_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        null=True, 
        blank=True, 
        on_delete=models.SET_NULL,
        verbose_name="Заблокировано пользователем"
    )
    locked_at = models.DateTimeField(null=True, blank=True, verbose_name="Время блокировки")

    class Meta:
        verbose_name = 'ТМЦ'
        verbose_name_plural = 'ТМЦ'

    def __str__(self):
        return f"{self.name} ({self.serial})"

class ItemHistory(models.Model):
    item = models.ForeignKey(Item, on_delete=models.CASCADE, related_name='history')
    action = models.CharField(max_length=255, blank=True, null=True)  # Текст для человека (генерируется динамически из payload)
    action_type = models.CharField(
        max_length=50,
        choices=HistoryAction.choices,
        null=True,
        blank=True,
        verbose_name="Тип действия"
    )  # Типизированное действие для фильтрации
    payload = models.JSONField(null=True, blank=True)  # Структурированные параметры для генерации текста
    comment = models.TextField(blank=True, null=True)  # Дополнительный комментарий
    
    # Структурированные данные для системы
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        verbose_name="Пользователь"
    )
    location = models.ForeignKey(
        'Location',
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        verbose_name="Локация"
    )
    
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-timestamp']
        verbose_name = 'История ТМЦ'
        verbose_name_plural = 'История ТМЦ'

    def save(self, *args, **kwargs):
        """Автоматически генерируем текстовое действие из шаблона при сохранении"""
        from .enums import HistoryActionTemplates

        if self.action_type and not self.action:
            # Генерируем текст из шаблона
            self.action = HistoryActionTemplates.format(self.action_type, self.payload)

        super().save(*args, **kwargs)


class WriteOffRecord(models.Model):
    """
    Модель записи о списании ТМЦ.

    Агрегат для бухгалтерски значимой операции списания.
    Обеспечивает полную историю списания с финансовыми данными.

    Инварианты:
    - У одного Item может быть только одна активная (is_cancelled=False) запись списания.
    - cascade delete запрещён (on_delete=PROTECT).
    """

    item = models.ForeignKey(
        'Item',
        on_delete=models.PROTECT,
        related_name='write_off_records',
        verbose_name="ТМЦ"
    )

    location = models.ForeignKey(
        'Location',
        on_delete=models.PROTECT,
        related_name='write_off_records',
        verbose_name="Локация списания",
        null=True,
        blank=True
    )

    repair_cost = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        verbose_name="Стоимость ремонта/списания"
    )

    invoice_number = models.CharField(
        max_length=255,
        verbose_name="Номер накладной"
    )

    description = models.TextField(
        blank=True,
        default="",
        verbose_name="Описание причины списания"
    )

    date_to_service = models.DateField(
        verbose_name="Дата поступления в ремонт"
    )

    date_written_off = models.DateField(
        verbose_name="Дата списания"
    )

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='write_off_records',
        verbose_name="Кто создал запись"
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name="Дата создания записи"
    )

    is_cancelled = models.BooleanField(
        default=False,
        verbose_name="Запись отменена"
    )

    cancelled_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name="Дата отмены"
    )

    class Meta:
        verbose_name = 'Запись о списании'
        verbose_name_plural = 'Записи о списании'
        constraints = [
            # У одного Item может быть только одна активная (is_cancelled=False) запись
            models.UniqueConstraint(
                fields=['item', 'is_cancelled'],
                condition=models.Q(is_cancelled=False),
                name='unique_active_write_off_per_item'
            )
        ]

    def __str__(self):
        return f"Списание {self.item.name} от {self.date_written_off}"

