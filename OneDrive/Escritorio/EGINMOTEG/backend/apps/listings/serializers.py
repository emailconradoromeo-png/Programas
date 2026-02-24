from rest_framework import serializers

from .models import Favorite, Listing


# ---------------------------------------------------------------------------
# Nested helpers for the Property model
# ---------------------------------------------------------------------------


class PropertyBasicSerializer(serializers.Serializer):
    """Lightweight property representation for listing lists."""

    id = serializers.UUIDField(read_only=True)
    title = serializers.CharField(read_only=True)
    city = serializers.CharField(read_only=True)
    primary_image = serializers.ImageField(read_only=True)
    area_m2 = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    bedrooms = serializers.IntegerField(read_only=True)
    category_slug = serializers.CharField(source="category.slug", read_only=True)
    category_name = serializers.CharField(source="category.name", read_only=True)
    extra_attributes = serializers.JSONField(read_only=True)


class CategoryNestedSerializer(serializers.Serializer):
    """Category with fields_schema for detail views."""

    id = serializers.IntegerField(read_only=True)
    name = serializers.CharField(read_only=True)
    slug = serializers.SlugField(read_only=True)
    icon = serializers.CharField(read_only=True)
    fields_schema = serializers.JSONField(read_only=True)


class PropertyDetailSerializer(serializers.Serializer):
    """Full property representation for listing detail."""

    id = serializers.UUIDField(read_only=True)
    title = serializers.CharField(read_only=True)
    description = serializers.CharField(read_only=True)
    city = serializers.CharField(read_only=True)
    address = serializers.CharField(read_only=True)
    neighborhood = serializers.CharField(read_only=True)
    category = CategoryNestedSerializer(read_only=True)
    primary_image = serializers.ImageField(read_only=True)
    area_m2 = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    bedrooms = serializers.IntegerField(read_only=True)
    bathrooms = serializers.IntegerField(read_only=True)
    floors = serializers.IntegerField(read_only=True)
    year_built = serializers.IntegerField(read_only=True)
    extra_attributes = serializers.JSONField(read_only=True)
    is_verified = serializers.BooleanField(read_only=True)
    latitude = serializers.DecimalField(
        max_digits=9, decimal_places=6, read_only=True
    )
    longitude = serializers.DecimalField(
        max_digits=9, decimal_places=6, read_only=True
    )


# ---------------------------------------------------------------------------
# Listing serializers
# ---------------------------------------------------------------------------


class ListingListSerializer(serializers.ModelSerializer):
    """Serializer used for listing list / search results."""

    property = PropertyBasicSerializer(read_only=True)
    posted_by_username = serializers.CharField(
        source="posted_by.username", read_only=True
    )
    is_favorited = serializers.SerializerMethodField()

    class Meta:
        model = Listing
        fields = [
            "id",
            "property",
            "posted_by",
            "posted_by_username",
            "operation_type",
            "price",
            "currency",
            "price_xaf",
            "price_negotiable",
            "status",
            "is_featured",
            "views_count",
            "contacts_count",
            "published_at",
            "created_at",
            "is_favorited",
        ]
        read_only_fields = fields

    def get_is_favorited(self, obj):
        request = self.context.get("request")
        if request and request.user.is_authenticated:
            return Favorite.objects.filter(
                user=request.user, listing=obj
            ).exists()
        return False


class ListingDetailSerializer(serializers.ModelSerializer):
    """Serializer used for the listing detail endpoint."""

    property = PropertyDetailSerializer(read_only=True)
    posted_by_username = serializers.CharField(
        source="posted_by.username", read_only=True
    )
    is_favorited = serializers.SerializerMethodField()

    class Meta:
        model = Listing
        fields = [
            "id",
            "property",
            "posted_by",
            "posted_by_username",
            "operation_type",
            "price",
            "currency",
            "price_xaf",
            "price_negotiable",
            "deposit_amount",
            "deposit_currency",
            "status",
            "is_featured",
            "views_count",
            "contacts_count",
            "published_at",
            "expires_at",
            "created_at",
            "is_favorited",
        ]
        read_only_fields = fields

    def get_is_favorited(self, obj):
        request = self.context.get("request")
        if request and request.user.is_authenticated:
            return Favorite.objects.filter(
                user=request.user, listing=obj
            ).exists()
        return False


class ListingCreateUpdateSerializer(serializers.ModelSerializer):
    """Serializer for creating and updating listings."""

    class Meta:
        model = Listing
        fields = [
            "property",
            "operation_type",
            "price",
            "currency",
            "price_xaf",
            "price_negotiable",
            "deposit_amount",
            "deposit_currency",
            "status",
            "is_featured",
            "published_at",
            "expires_at",
        ]

    def validate(self, attrs):
        # Ensure price_xaf is set; if not provided, default to price when XAF.
        if "price_xaf" not in attrs or attrs.get("price_xaf") is None:
            if attrs.get("currency", "XAF") == "XAF":
                attrs["price_xaf"] = attrs.get("price")
        return attrs


# ---------------------------------------------------------------------------
# Favorite serializer
# ---------------------------------------------------------------------------


class FavoriteSerializer(serializers.ModelSerializer):
    listing = ListingListSerializer(read_only=True)

    class Meta:
        model = Favorite
        fields = ["id", "listing", "created_at"]
        read_only_fields = ["id", "created_at"]
