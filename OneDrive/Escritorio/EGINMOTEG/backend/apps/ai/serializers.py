from rest_framework import serializers

from .models import (
    ChatMessage,
    ChatSession,
    ImageAnalysis,
    PropertyValuation,
    Recommendation,
    SearchHistory,
)


class PropertyValuationSerializer(serializers.ModelSerializer):
    property_title = serializers.CharField(
        source="property.title", read_only=True
    )

    class Meta:
        model = PropertyValuation
        fields = [
            "id",
            "property",
            "property_title",
            "estimated_price_xaf",
            "confidence_score",
            "comparable_listings",
            "factors",
            "created_at",
        ]
        read_only_fields = [
            "id",
            "estimated_price_xaf",
            "confidence_score",
            "comparable_listings",
            "factors",
            "created_at",
        ]


class ValuationRequestSerializer(serializers.Serializer):
    property_id = serializers.UUIDField()


class RecommendationSerializer(serializers.ModelSerializer):
    listing_id = serializers.UUIDField(source="listing.id", read_only=True)
    listing_title = serializers.CharField(
        source="listing.property.title", read_only=True
    )
    listing_price = serializers.DecimalField(
        source="listing.price",
        max_digits=12,
        decimal_places=2,
        read_only=True,
    )
    listing_currency = serializers.CharField(
        source="listing.currency", read_only=True
    )
    listing_city = serializers.CharField(
        source="listing.property.city", read_only=True
    )
    listing_image = serializers.SerializerMethodField()
    listing_operation_type = serializers.CharField(
        source="listing.operation_type", read_only=True
    )

    class Meta:
        model = Recommendation
        fields = [
            "id",
            "listing_id",
            "listing_title",
            "listing_price",
            "listing_currency",
            "listing_city",
            "listing_image",
            "listing_operation_type",
            "score",
            "reason",
            "created_at",
        ]
        read_only_fields = fields

    def get_listing_image(self, obj):
        primary = obj.listing.property.images.filter(is_primary=True).first()
        if not primary:
            primary = obj.listing.property.images.first()
        if primary:
            request = self.context.get("request")
            if request:
                return request.build_absolute_uri(primary.image.url)
            return primary.image.url
        return None


class ChatMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChatMessage
        fields = ["id", "role", "content", "created_at"]
        read_only_fields = ["id", "created_at"]


class ChatSessionSerializer(serializers.ModelSerializer):
    messages = ChatMessageSerializer(many=True, read_only=True)
    message_count = serializers.SerializerMethodField()

    class Meta:
        model = ChatSession
        fields = [
            "id",
            "title",
            "context",
            "message_count",
            "messages",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def get_message_count(self, obj):
        return obj.messages.count()


class ChatSessionListSerializer(serializers.ModelSerializer):
    message_count = serializers.SerializerMethodField()
    last_message = serializers.SerializerMethodField()

    class Meta:
        model = ChatSession
        fields = [
            "id",
            "title",
            "message_count",
            "last_message",
            "created_at",
            "updated_at",
        ]
        read_only_fields = fields

    def get_message_count(self, obj):
        return obj.messages.count()

    def get_last_message(self, obj):
        last = obj.messages.order_by("-created_at").first()
        if last:
            return {
                "role": last.role,
                "content": last.content[:100],
                "created_at": last.created_at.isoformat(),
            }
        return None


class ChatRequestSerializer(serializers.Serializer):
    message = serializers.CharField(max_length=2000)
    session_id = serializers.UUIDField(required=False)


class ImageAnalysisSerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = ImageAnalysis
        fields = [
            "id",
            "property_image",
            "image_url",
            "room_type",
            "quality_score",
            "description",
            "features",
            "status",
            "error_message",
            "created_at",
        ]
        read_only_fields = [
            "id",
            "room_type",
            "quality_score",
            "description",
            "features",
            "status",
            "error_message",
            "created_at",
        ]

    def get_image_url(self, obj):
        request = self.context.get("request")
        if obj.property_image and obj.property_image.image:
            if request:
                return request.build_absolute_uri(obj.property_image.image.url)
            return obj.property_image.image.url
        return None


class ImageAnalysisRequestSerializer(serializers.Serializer):
    property_image_id = serializers.IntegerField()


class SearchHistorySerializer(serializers.ModelSerializer):
    class Meta:
        model = SearchHistory
        fields = ["id", "query", "filters", "created_at"]
        read_only_fields = ["id", "created_at"]
