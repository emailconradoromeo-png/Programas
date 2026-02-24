import logging

from celery import shared_task

logger = logging.getLogger(__name__)


@shared_task(bind=True, max_retries=3, default_retry_delay=60)
def generate_valuation(self, property_id):
    """Genera una valoración automática para una propiedad."""
    try:
        from apps.properties.models import Property

        from .models import PropertyValuation
        from .services import ValuationService

        property_obj = Property.objects.select_related("category").get(
            id=property_id
        )
        result = ValuationService.estimate_price(property_obj)

        # Crear o actualizar la valoración
        PropertyValuation.objects.update_or_create(
            property=property_obj,
            defaults={
                "estimated_price_xaf": result["estimated_price_xaf"],
                "confidence_score": result["confidence_score"],
                "comparable_listings": result["comparable_listings"],
                "factors": result["factors"],
            },
        )

        logger.info("Valoración generada para propiedad %s", property_id)

    except Exception as exc:
        logger.error("Error generando valoración: %s", exc)
        raise self.retry(exc=exc)


@shared_task(bind=True, max_retries=3, default_retry_delay=60)
def generate_recommendations(self, user_id):
    """Genera recomendaciones personalizadas para un usuario."""
    try:
        from django.contrib.auth import get_user_model

        from .services import RecommendationService

        User = get_user_model()
        user = User.objects.get(id=user_id)
        created = RecommendationService.generate_for_user(user)
        logger.info(
            "Generadas %d recomendaciones para usuario %s",
            len(created),
            user_id,
        )

    except Exception as exc:
        logger.error("Error generando recomendaciones: %s", exc)
        raise self.retry(exc=exc)


@shared_task(bind=True, max_retries=3, default_retry_delay=60)
def analyze_property_image(self, analysis_id):
    """Analiza una imagen de propiedad con IA Vision."""
    try:
        from .models import ImageAnalysis
        from .services import ImageAnalysisService

        analysis = ImageAnalysis.objects.get(id=analysis_id)
        ImageAnalysisService.analyze_image(analysis)
        logger.info("Análisis de imagen completado: %s", analysis_id)

    except Exception as exc:
        logger.error("Error analizando imagen: %s", exc)
        raise self.retry(exc=exc)


@shared_task
def retrain_valuation_model():
    """Re-entrena el modelo de valoración periódicamente."""
    logger.info("Re-entrenamiento del modelo de valoración iniciado.")
    # El modelo actual usa cálculos estadísticos en tiempo real.
    # Este task puede expandirse para entrenar un modelo sklearn
    # y guardarlo con joblib cuando haya suficientes datos.
    from apps.listings.models import Listing

    active_count = Listing.objects.filter(status="activo").count()
    logger.info(
        "Re-entrenamiento completado. %d anuncios activos disponibles.",
        active_count,
    )
