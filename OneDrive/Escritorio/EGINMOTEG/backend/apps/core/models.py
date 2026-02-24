from django.conf import settings
from django.db import models


class AuditMixin(models.Model):
    """Abstract mixin that adds audit fields to any model."""

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="%(class)s_created",
    )

    class Meta:
        abstract = True


class SoftDeleteMixin(models.Model):
    """Abstract mixin for soft delete functionality."""

    is_deleted = models.BooleanField(default=False)
    deleted_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        abstract = True

    def soft_delete(self):
        from django.utils import timezone

        self.is_deleted = True
        self.deleted_at = timezone.now()
        self.save(update_fields=["is_deleted", "deleted_at"])


class CurrencyRate(models.Model):
    """Exchange rates between currencies used in the platform."""

    from_currency = models.CharField(max_length=3)
    to_currency = models.CharField(max_length=3)
    rate = models.DecimalField(max_digits=12, decimal_places=6)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ("from_currency", "to_currency")
        verbose_name = "Tasa de cambio"
        verbose_name_plural = "Tasas de cambio"

    def __str__(self):
        return f"{self.from_currency} -> {self.to_currency}: {self.rate}"

    @classmethod
    def convert(cls, amount, from_currency, to_currency):
        if from_currency == to_currency:
            return amount
        try:
            rate = cls.objects.get(
                from_currency=from_currency, to_currency=to_currency
            )
            return amount * rate.rate
        except cls.DoesNotExist:
            return None
