import uuid

from django.conf import settings
from django.db import models


class PropertyValuation(models.Model):
    """Valoración automática de una propiedad usando ML."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    property = models.ForeignKey(
        "properties.Property",
        on_delete=models.CASCADE,
        related_name="valuations",
        verbose_name="Propiedad",
    )
    estimated_price_xaf = models.DecimalField(
        max_digits=14,
        decimal_places=2,
        verbose_name="Precio estimado (XAF)",
    )
    confidence_score = models.FloatField(
        verbose_name="Puntuación de confianza",
        help_text="Valor entre 0 y 1 indicando confianza de la estimación.",
    )
    comparable_listings = models.JSONField(
        default=list,
        blank=True,
        verbose_name="Anuncios comparables",
        help_text="IDs y precios de anuncios similares usados como referencia.",
    )
    factors = models.JSONField(
        default=dict,
        blank=True,
        verbose_name="Factores de valoración",
        help_text="Factores que influyeron en el precio estimado.",
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Creado")

    class Meta:
        verbose_name = "Valoración de propiedad"
        verbose_name_plural = "Valoraciones de propiedades"
        ordering = ["-created_at"]

    def __str__(self):
        return f"Valoración {self.property.title}: {self.estimated_price_xaf} XAF"


class SearchHistory(models.Model):
    """Historial de búsquedas del usuario para recomendaciones."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="search_history",
        verbose_name="Usuario",
    )
    query = models.CharField(max_length=500, blank=True, default="", verbose_name="Consulta")
    filters = models.JSONField(
        default=dict,
        blank=True,
        verbose_name="Filtros aplicados",
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Creado")

    class Meta:
        verbose_name = "Historial de búsqueda"
        verbose_name_plural = "Historial de búsquedas"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.user.username}: {self.query or 'sin consulta'}"


class Recommendation(models.Model):
    """Recomendación personalizada de un anuncio para un usuario."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="recommendations",
        verbose_name="Usuario",
    )
    listing = models.ForeignKey(
        "listings.Listing",
        on_delete=models.CASCADE,
        related_name="recommendations",
        verbose_name="Anuncio",
    )
    score = models.FloatField(
        verbose_name="Puntuación de relevancia",
        help_text="Valor entre 0 y 1 indicando relevancia para el usuario.",
    )
    reason = models.TextField(
        blank=True,
        default="",
        verbose_name="Razón",
        help_text="Explicación de por qué se recomienda este anuncio.",
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Creado")

    class Meta:
        verbose_name = "Recomendación"
        verbose_name_plural = "Recomendaciones"
        ordering = ["-score", "-created_at"]
        unique_together = ("user", "listing")

    def __str__(self):
        return f"Rec. {self.user.username} → {self.listing} ({self.score:.2f})"


class ChatSession(models.Model):
    """Sesión de chat con el asistente IA."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="chat_sessions",
        verbose_name="Usuario",
    )
    title = models.CharField(
        max_length=200,
        blank=True,
        default="",
        verbose_name="Título",
    )
    context = models.JSONField(
        default=dict,
        blank=True,
        verbose_name="Contexto de la sesión",
        help_text="Datos adicionales de contexto para la conversación.",
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Creado")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Actualizado")

    class Meta:
        verbose_name = "Sesión de chat"
        verbose_name_plural = "Sesiones de chat"
        ordering = ["-updated_at"]

    def __str__(self):
        return f"Chat {self.user.username}: {self.title or 'Sin título'}"


class ChatMessage(models.Model):
    """Mensaje individual en una sesión de chat."""

    ROLE_CHOICES = [
        ("user", "Usuario"),
        ("assistant", "Asistente"),
        ("system", "Sistema"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    session = models.ForeignKey(
        ChatSession,
        on_delete=models.CASCADE,
        related_name="messages",
        verbose_name="Sesión",
    )
    role = models.CharField(
        max_length=10,
        choices=ROLE_CHOICES,
        verbose_name="Rol",
    )
    content = models.TextField(verbose_name="Contenido")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Creado")

    class Meta:
        verbose_name = "Mensaje de chat"
        verbose_name_plural = "Mensajes de chat"
        ordering = ["created_at"]

    def __str__(self):
        return f"[{self.role}] {self.content[:50]}"


class ImageAnalysis(models.Model):
    """Análisis de una imagen de propiedad usando IA Vision."""

    STATUS_CHOICES = [
        ("pendiente", "Pendiente"),
        ("procesando", "Procesando"),
        ("completado", "Completado"),
        ("error", "Error"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    property_image = models.ForeignKey(
        "properties.PropertyImage",
        on_delete=models.CASCADE,
        related_name="analyses",
        verbose_name="Imagen de propiedad",
    )
    room_type = models.CharField(
        max_length=50,
        blank=True,
        default="",
        verbose_name="Tipo de habitación",
    )
    quality_score = models.FloatField(
        null=True,
        blank=True,
        verbose_name="Puntuación de calidad",
        help_text="Valor entre 0 y 10 indicando calidad de la imagen/espacio.",
    )
    description = models.TextField(
        blank=True,
        default="",
        verbose_name="Descripción generada",
    )
    features = models.JSONField(
        default=list,
        blank=True,
        verbose_name="Características detectadas",
    )
    status = models.CharField(
        max_length=15,
        choices=STATUS_CHOICES,
        default="pendiente",
        verbose_name="Estado",
    )
    error_message = models.TextField(
        blank=True,
        default="",
        verbose_name="Mensaje de error",
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Creado")

    class Meta:
        verbose_name = "Análisis de imagen"
        verbose_name_plural = "Análisis de imágenes"
        ordering = ["-created_at"]

    def __str__(self):
        return f"Análisis imagen {self.property_image_id} ({self.status})"
