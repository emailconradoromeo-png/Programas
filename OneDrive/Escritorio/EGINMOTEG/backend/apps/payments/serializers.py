from rest_framework import serializers

from .models import Payment, Subscription, SubscriptionPlan


class SubscriptionPlanSerializer(serializers.ModelSerializer):
    class Meta:
        model = SubscriptionPlan
        fields = [
            "id",
            "name",
            "slug",
            "price_xaf",
            "price_eur",
            "duration_days",
            "max_listings",
            "features",
            "is_active",
            "created_at",
        ]


class SubscriptionSerializer(serializers.ModelSerializer):
    plan = SubscriptionPlanSerializer(read_only=True)

    class Meta:
        model = Subscription
        fields = [
            "id",
            "user",
            "plan",
            "status",
            "starts_at",
            "expires_at",
            "auto_renew",
            "created_at",
        ]
        read_only_fields = ["id", "user", "status", "starts_at", "expires_at", "created_at"]


class SubscribeSerializer(serializers.Serializer):
    plan_id = serializers.IntegerField()
    payment_method = serializers.ChoiceField(
        choices=Payment.PAYMENT_METHOD_CHOICES,
    )
    currency = serializers.ChoiceField(
        choices=Payment.CURRENCY_CHOICES,
    )

    def validate_plan_id(self, value):
        try:
            plan = SubscriptionPlan.objects.get(id=value, is_active=True)
        except SubscriptionPlan.DoesNotExist:
            raise serializers.ValidationError("Plan no encontrado o no está activo.")
        return value


class PaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = [
            "id",
            "user",
            "subscription",
            "amount",
            "currency",
            "payment_method",
            "status",
            "reference",
            "metadata",
            "created_at",
        ]
        read_only_fields = [
            "id",
            "user",
            "subscription",
            "amount",
            "currency",
            "payment_method",
            "status",
            "reference",
            "metadata",
            "created_at",
        ]


class PaymentHistorySerializer(serializers.ModelSerializer):
    plan_name = serializers.CharField(source="subscription.plan.name", default=None)

    class Meta:
        model = Payment
        fields = [
            "id",
            "amount",
            "currency",
            "payment_method",
            "status",
            "reference",
            "plan_name",
            "created_at",
        ]
