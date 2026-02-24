import uuid
from datetime import timedelta

from django.utils import timezone
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Payment, Subscription, SubscriptionPlan
from .serializers import (
    PaymentHistorySerializer,
    SubscribeSerializer,
    SubscriptionPlanSerializer,
    SubscriptionSerializer,
)


class SubscriptionPlanListView(generics.ListAPIView):
    """GET /plans/ - List all active subscription plans."""

    queryset = SubscriptionPlan.objects.filter(is_active=True)
    serializer_class = SubscriptionPlanSerializer
    permission_classes = [permissions.AllowAny]


class SubscribeView(APIView):
    """POST /subscribe/ - Subscribe to a plan."""

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = SubscribeSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        plan = SubscriptionPlan.objects.get(
            id=serializer.validated_data["plan_id"], is_active=True
        )
        currency = serializer.validated_data["currency"]
        payment_method = serializer.validated_data["payment_method"]

        # Determine the amount based on the currency
        if currency == "XAF":
            amount = plan.price_xaf
        elif currency == "EUR":
            amount = plan.price_eur
        else:
            amount = plan.price_xaf  # Default to XAF for USD (placeholder)

        now = timezone.now()

        # Create the subscription
        subscription = Subscription.objects.create(
            user=request.user,
            plan=plan,
            status="activo",
            starts_at=now,
            expires_at=now + timedelta(days=plan.duration_days),
        )

        # Create the payment record
        payment = Payment.objects.create(
            user=request.user,
            subscription=subscription,
            amount=amount,
            currency=currency,
            payment_method=payment_method,
            status="pendiente",
            reference=f"PAY-{uuid.uuid4().hex[:16].upper()}",
        )

        return Response(
            {
                "subscription": SubscriptionSerializer(subscription).data,
                "payment": {
                    "id": str(payment.id),
                    "amount": str(payment.amount),
                    "currency": payment.currency,
                    "status": payment.status,
                    "reference": payment.reference,
                },
            },
            status=status.HTTP_201_CREATED,
        )


class MySubscriptionView(generics.RetrieveAPIView):
    """GET /my-subscription/ - Get current active subscription."""

    serializer_class = SubscriptionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        subscription = (
            Subscription.objects.filter(user=self.request.user, status="activo")
            .select_related("plan")
            .order_by("-created_at")
            .first()
        )
        if subscription is None:
            from django.http import Http404

            raise Http404("No tienes una suscripción activa.")
        return subscription


class PaymentHistoryView(generics.ListAPIView):
    """GET /history/ - Payment history for the authenticated user."""

    serializer_class = PaymentHistorySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return (
            Payment.objects.filter(user=self.request.user)
            .select_related("subscription__plan")
            .order_by("-created_at")
        )
