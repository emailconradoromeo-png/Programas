import uuid

from django.contrib.auth.models import AbstractUser
from django.db import models
from simple_history.models import HistoricalRecords


class User(AbstractUser):
    ROLE_CHOICES = [
        ("propietario", "Propietario"),
        ("inquilino", "Inquilino"),
        ("agente", "Agente"),
        ("admin", "Administrador"),
    ]
    LANGUAGE_CHOICES = [
        ("es", "Español"),
        ("fr", "Français"),
    ]
    CURRENCY_CHOICES = [
        ("XAF", "Franco CFA"),
        ("EUR", "Euro"),
        ("USD", "Dólar"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    phone = models.CharField(max_length=20, unique=True, null=True, blank=True)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default="inquilino")
    language = models.CharField(max_length=2, choices=LANGUAGE_CHOICES, default="es")
    preferred_currency = models.CharField(
        max_length=3, choices=CURRENCY_CHOICES, default="XAF"
    )
    is_verified = models.BooleanField(default=False)

    history = HistoricalRecords()

    class Meta:
        verbose_name = "Usuario"
        verbose_name_plural = "Usuarios"

    def __str__(self):
        return f"{self.get_full_name() or self.username} ({self.role})"


class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="profile")
    avatar = models.ImageField(upload_to="avatars/", null=True, blank=True)
    bio = models.TextField(blank=True, default="")
    company_name = models.CharField(max_length=200, blank=True, default="")
    license_number = models.CharField(max_length=100, blank=True, default="")
    address = models.CharField(max_length=300, blank=True, default="")
    city = models.CharField(max_length=100, blank=True, default="")
    reputation_score = models.DecimalField(
        max_digits=3, decimal_places=1, default=0.0
    )
    total_reviews = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Perfil de usuario"
        verbose_name_plural = "Perfiles de usuario"

    def __str__(self):
        return f"Perfil de {self.user.username}"


class KYCDocument(models.Model):
    DOCUMENT_TYPE_CHOICES = [
        ("dni", "DNI / Cédula"),
        ("pasaporte", "Pasaporte"),
        ("licencia_agente", "Licencia de Agente"),
        ("titulo_propiedad", "Título de Propiedad"),
    ]
    STATUS_CHOICES = [
        ("pendiente", "Pendiente"),
        ("aprobado", "Aprobado"),
        ("rechazado", "Rechazado"),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="kyc_documents")
    document_type = models.CharField(max_length=30, choices=DOCUMENT_TYPE_CHOICES)
    document_file = models.FileField(upload_to="kyc/")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pendiente")
    reviewed_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="reviewed_kyc",
    )
    reviewed_at = models.DateTimeField(null=True, blank=True)
    notes = models.TextField(blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Documento KYC"
        verbose_name_plural = "Documentos KYC"

    def __str__(self):
        return f"{self.get_document_type_display()} - {self.user.username} ({self.status})"
