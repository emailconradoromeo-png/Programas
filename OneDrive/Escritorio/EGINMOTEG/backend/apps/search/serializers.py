from rest_framework import serializers

from apps.listings.models import Listing


class SearchResultSerializer(serializers.ModelSerializer):
    """Flat serializer that combines listing + property info for search results."""

    title = serializers.CharField(source="property.title", read_only=True)
    city = serializers.CharField(source="property.city", read_only=True)
    bedrooms = serializers.IntegerField(source="property.bedrooms", read_only=True)
    bathrooms = serializers.IntegerField(source="property.bathrooms", read_only=True)
    area_m2 = serializers.DecimalField(
        source="property.area_m2",
        max_digits=10,
        decimal_places=2,
        read_only=True,
    )
    primary_image_url = serializers.SerializerMethodField()
    latitude = serializers.SerializerMethodField()
    longitude = serializers.SerializerMethodField()

    class Meta:
        model = Listing
        fields = [
            "id",
            "title",
            "city",
            "price",
            "currency",
            "operation_type",
            "bedrooms",
            "bathrooms",
            "area_m2",
            "primary_image_url",
            "latitude",
            "longitude",
            "is_featured",
        ]
        read_only_fields = fields

    def get_primary_image_url(self, obj):
        """Return the URL of the primary image, or the first image if none is primary."""
        request = self.context.get("request")
        image = obj.property.images.filter(is_primary=True).first()
        if image is None:
            image = obj.property.images.first()
        if image and image.image:
            url = image.image.url
            if request is not None:
                return request.build_absolute_uri(url)
            return url
        return None

    def get_latitude(self, obj):
        location = obj.property.location
        if location:
            return location.y
        return None

    def get_longitude(self, obj):
        location = obj.property.location
        if location:
            return location.x
        return None
