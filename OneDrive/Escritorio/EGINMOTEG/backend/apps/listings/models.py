import uuid

from django.conf import settings
from django.db import models
from simple_history.models import HistoricalRecords


class Listing(models.Model):
    OPERATION_TYPE_CHOICES = [
        ("venta", "Venta"),
        ("alquiler", "Alquiler"),
        ("alquiler_vacacional", "Alquiler Vacacional"),
    ]
    CURRENCY_CHOICES = [
        ("XAF", "Franco CFA"),
        ("EUR", "Euro"),
        ("USD", "Dólar"),
    ]
    STATUS_CHOICES = [
        ("activo", "Activo"),
        ("pausado", "Pausado"),
        ("vendido", "Vendido"),
        ("alquilado", "Alquilado"),
        ("expirado", "Expirado"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    property = models.ForeignKey(
        "properties.Property",
        on_delete=models.CASCADE,
        related_name="listings",
        verbose_name="Propiedad",
    )
    posted_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="listings",
        verbose_name="Publicado por",
    )
    operation_type = models.CharField(
        max_length=25,
        choices=OPERATION_TYPE_CHOICES,
        verbose_name="Tipo de operación",
    )
    price = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        verbose_name="Precio",
    )
    currency = models.CharField(
        max_length=3,
        choices=CURRENCY_CHOICES,
        default="XAF",
        verbose_name="Moneda",
    )
    price_xaf = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        verbose_name="Precio en XAF (normalizado)",
        help_text="Precio convertido a XAF para búsquedas normalizadas.",
    )
    price_negotiable = models.BooleanField(
        default=False,
        verbose_name="Precio negociable",
    )
    deposit_amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        null=True,
        blank=True,
        verbose_name="Monto de depósito",
    )
    deposit_currency = models.CharField(
        max_length=3,
        null=True,
        blank=True,
        verbose_name="Moneda del depósito",
    )
    status = models.CharField(
        max_length=15,
        choices=STATUS_CHOICES,
        default="activo",
        verbose_name="Estado",
    )
    is_featured = models.BooleanField(
        default=False,
        verbose_name="Destacado",
    )
    views_count = models.IntegerField(
        default=0,
        verbose_name="Vistas",
    )
    contacts_count = models.IntegerField(
        default=0,
        verbose_name="Contactos",
    )
    published_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name="Fecha de publicación",
    )
    expires_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name="Fecha de expiración",
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Creado")

    history = HistoricalRecords()

    class Meta:
        verbose_name = "Anuncio"
        verbose_name_plural = "Anuncios"
        ordering = ["-created_at"]

    def __str__(self):
        return (
            f"{self.get_operation_type_display()} - "
            f"{self.price} {self.currency} ({self.status})"
        )


class Favorite(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="favorites",
        verbose_name="Usuario",
    )
    listing = models.ForeignKey(
        Listing,
        on_delete=models.CASCADE,
        related_name="favorites",
        verbose_name="Anuncio",
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Creado")

    class Meta:
        unique_together = ("user", "listing")
        verbose_name = "Favorito"
        verbose_name_plural = "Favoritos"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.user} - {self.listing}"
