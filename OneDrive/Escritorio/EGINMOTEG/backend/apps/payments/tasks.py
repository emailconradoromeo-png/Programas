import logging

from celery import shared_task
from django.utils import timezone

logger = logging.getLogger(__name__)


@shared_task
def check_expired_subscriptions():
    """Runs periodically to mark expired subscriptions."""
    from .models import Subscription

    now = timezone.now()
    expired = Subscription.objects.filter(
        status="activo",
        expires_at__lte=now,
    )
    count = expired.update(status="expirado")
    logger.info("Marcadas %d suscripciones como expiradas.", count)
    return count


@shared_task
def process_payment(payment_id):
    """Placeholder for payment processing logic.

    In a production environment this would integrate with a payment
    gateway (e.g., Mobile Money API, Stripe, etc.) to process the
    payment and update its status accordingly.
    """
    from .models import Payment

    try:
        payment = Payment.objects.get(id=payment_id)
    except Payment.DoesNotExist:
        logger.error("Pago %s no encontrado.", payment_id)
        return None

    # --- Placeholder: integrate with payment gateway here ---
    # For now, we simply mark the payment as completed.
    payment.status = "completado"
    payment.save(update_fields=["status"])

    logger.info(
        "Pago %s procesado exitosamente. Referencia: %s",
        payment_id,
        payment.reference,
    )
    return str(payment.id)
