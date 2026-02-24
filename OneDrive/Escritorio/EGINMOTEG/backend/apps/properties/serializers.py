from rest_framework import serializers

from .models import Category, Property, PropertyImage


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = "__all__"


class PropertyImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = PropertyImage
        fields = ["id", "property", "image", "thumbnail", "caption", "order", "is_primary"]
        read_only_fields = ["id"]


class OwnerBriefSerializer(serializers.Serializer):
    id = serializers.UUIDField(read_only=True)
    username = serializers.CharField(read_only=True)
    first_name = serializers.CharField(read_only=True)
    last_name = serializers.CharField(read_only=True)
    phone = serializers.CharField(read_only=True)


class PropertyListSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source="category.name", read_only=True)
    primary_image = serializers.SerializerMethodField()
    owner = OwnerBriefSerializer(read_only=True)

    class Meta:
        model = Property
        fields = [
            "id",
            "title",
            "city",
            "area_m2",
            "bedrooms",
            "bathrooms",
            "status",
            "category_name",
            "primary_image",
            "created_at",
            "owner",
        ]

    def get_primary_image(self, obj):
        image = obj.images.filter(is_primary=True).first()
        if not image:
            image = obj.images.first()
        if image:
            request = self.context.get("request")
            if request:
                return request.build_absolute_uri(image.image.url)
            return image.image.url
        return None


class PropertyDetailSerializer(serializers.ModelSerializer):
    images = PropertyImageSerializer(many=True, read_only=True)
    owner = OwnerBriefSerializer(read_only=True)
    category = CategorySerializer(read_only=True)
    category_id = serializers.IntegerField(write_only=True, required=False)

    class Meta:
        model = Property
        fields = [
            "id",
            "owner",
            "category",
            "category_id",
            "title",
            "description",
            "location",
            "address",
            "city",
            "neighborhood",
            "area_m2",
            "bedrooms",
            "bathrooms",
            "floors",
            "year_built",
            "extra_attributes",
            "is_verified",
            "verified_by",
            "status",
            "is_deleted",
            "created_at",
            "updated_at",
            "images",
        ]
        read_only_fields = [
            "id",
            "owner",
            "is_verified",
            "verified_by",
            "is_deleted",
            "created_at",
            "updated_at",
        ]


class PropertyCreateUpdateSerializer(serializers.ModelSerializer):
    images = serializers.ListField(
        child=serializers.ImageField(), write_only=True, required=False
    )
    category_slug = serializers.CharField(write_only=True, required=False)

    class Meta:
        model = Property
        fields = [
            "id",
            "category",
            "category_slug",
            "title",
            "description",
            "location",
            "address",
            "city",
            "neighborhood",
            "area_m2",
            "bedrooms",
            "bathrooms",
            "floors",
            "year_built",
            "extra_attributes",
            "status",
            "images",
        ]
        read_only_fields = ["id"]
        extra_kwargs = {
            "category": {"required": False},
        }

    def _resolve_category(self, validated_data):
        slug = validated_data.pop("category_slug", None)
        if slug and "category" not in validated_data:
            try:
                validated_data["category"] = Category.objects.get(slug=slug)
            except Category.DoesNotExist:
                raise serializers.ValidationError(
                    {"category_slug": f"Categoria con slug '{slug}' no encontrada."}
                )

    def create(self, validated_data):
        images_data = validated_data.pop("images", [])
        self._resolve_category(validated_data)
        validated_data["owner"] = self.context["request"].user
        prop = Property.objects.create(**validated_data)

        for i, image_file in enumerate(images_data):
            PropertyImage.objects.create(
                property=prop,
                image=image_file,
                order=i,
                is_primary=(i == 0),
            )

        return prop

    def update(self, instance, validated_data):
        images_data = validated_data.pop("images", None)
        self._resolve_category(validated_data)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if images_data is not None:
            existing_count = instance.images.count()
            for i, image_file in enumerate(images_data):
                PropertyImage.objects.create(
                    property=instance,
                    image=image_file,
                    order=existing_count + i,
                    is_primary=False,
                )

        return instance
