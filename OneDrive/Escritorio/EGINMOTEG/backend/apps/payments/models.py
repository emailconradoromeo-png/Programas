import uuid

from django.conf import settings
from django.db import models
from simple_history.models import HistoricalRecords


class SubscriptionPlan(models.Model):
    name = models.CharField(max_length=100)
    slug = models.SlugField(unique=True)
    price_xaf = models.DecimalField(max_digits=10, decimal_places=2)
    price_eur = models.DecimalField(max_digits=10, decimal_places=2)
    duration_days = models.IntegerField()
    max_listings = models.IntegerField()
    features = models.JSONField(default=dict)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Plan de suscripción"
        verbose_name_plural = "Planes de suscripción"
        ordering = ["price_xaf"]

    def __str__(self):
        return f"{self.name} ({self.price_xaf} XAF)"


class Subscription(models.Model):
    STATUS_CHOICES = [
        ("activo", "Activo"),
        ("expirado", "Expirado"),
        ("cancelado", "Cancelado"),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="subscriptions",
    )
    plan = models.ForeignKey(
        SubscriptionPlan,
        on_delete=models.PROTECT,
        related_name="subscriptions",
    )
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="activo")
    starts_at = models.DateTimeField()
    expires_at = models.DateTimeField()
    auto_renew = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Suscripción"
        verbose_name_plural = "Suscripciones"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.user} - {self.plan.name} ({self.status})"


class Payment(models.Model):
    CURRENCY_CHOICES = [
        ("XAF", "Franco CFA"),
        ("EUR", "Euro"),
        ("USD", "Dólar"),
    ]
    PAYMENT_METHOD_CHOICES = [
        ("bange_mobil", "Bange Mobil"),
        ("rosa_money", "Rosa Money"),
        ("muni_dinero", "Muni Dinero"),
        ("tarjeta", "Tarjeta"),
        ("transferencia", "Transferencia"),
    ]
    STATUS_CHOICES = [
        ("pendiente", "Pendiente"),
        ("completado", "Completado"),
        ("fallido", "Fallido"),
        ("reembolsado", "Reembolsado"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="payments",
    )
    subscription = models.ForeignKey(
        Subscription,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="payments",
    )
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    currency = models.CharField(max_length=3, choices=CURRENCY_CHOICES)
    payment_method = models.CharField(max_length=20, choices=PAYMENT_METHOD_CHOICES)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pendiente")
    reference = models.CharField(max_length=200, unique=True)
    metadata = models.JSONField(default=dict)
    created_at = models.DateTimeField(auto_now_add=True)

    history = HistoricalRecords()

    class Meta:
        verbose_name = "Pago"
        verbose_name_plural = "Pagos"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.reference} - {self.amount} {self.currency} ({self.status})"
