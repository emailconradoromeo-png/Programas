import uuid

from django.conf import settings
from django.contrib.gis.db import models as gis_models
from django.db import models
from simple_history.models import HistoricalRecords


class Category(models.Model):
    name = models.CharField(max_length=100)
    slug = models.SlugField(unique=True)
    icon = models.CharField(max_length=50, blank=True, default="")
    fields_schema = models.JSONField(default=dict, blank=True)

    class Meta:
        verbose_name = "Categoría"
        verbose_name_plural = "Categorías"
        ordering = ["name"]

    def __str__(self):
        return self.name


class Property(models.Model):
    CITY_CHOICES = [
        ("malabo", "Malabo"),
        ("bata", "Bata"),
        ("oyala", "Oyala"),
        ("ebebiyin", "Ebebiyín"),
        ("mongomo", "Mongomo"),
        ("otro", "Otro"),
    ]
    STATUS_CHOICES = [
        ("borrador", "Borrador"),
        ("activo", "Activo"),
        ("pausado", "Pausado"),
        ("vendido", "Vendido"),
        ("alquilado", "Alquilado"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="properties",
    )
    category = models.ForeignKey(
        Category,
        on_delete=models.PROTECT,
        related_name="properties",
    )
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True, default="")
    location = gis_models.PointField(srid=4326, null=True, blank=True)
    address = models.CharField(max_length=300, blank=True, default="")
    city = models.CharField(max_length=20, choices=CITY_CHOICES)
    neighborhood = models.CharField(max_length=100, blank=True, default="")
    area_m2 = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    bedrooms = models.IntegerField(null=True, blank=True)
    bathrooms = models.IntegerField(null=True, blank=True)
    floors = models.IntegerField(null=True, blank=True)
    year_built = models.IntegerField(null=True, blank=True)
    extra_attributes = models.JSONField(default=dict, blank=True)
    is_verified = models.BooleanField(default=False)
    verified_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="verified_properties",
    )
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="borrador")
    is_deleted = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    history = HistoricalRecords()

    class Meta:
        verbose_name = "Propiedad"
        verbose_name_plural = "Propiedades"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.title} ({self.get_city_display()})"


class PropertyImage(models.Model):
    property = models.ForeignKey(
        Property,
        on_delete=models.CASCADE,
        related_name="images",
    )
    image = models.ImageField(upload_to="properties/")
    thumbnail = models.ImageField(
        upload_to="properties/thumbnails/", null=True, blank=True
    )
    caption = models.CharField(max_length=200, blank=True, default="")
    order = models.IntegerField(default=0)
    is_primary = models.BooleanField(default=False)

    class Meta:
        verbose_name = "Imagen de propiedad"
        verbose_name_plural = "Imágenes de propiedad"
        ordering = ["order"]

    def __str__(self):
        return f"Imagen {self.order} de {self.property.title}"
