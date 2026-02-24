from rest_framework import generics, permissions, status
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.response import Response

from apps.core.permissions import IsOwnerOrAdmin

from .filters import PropertyFilter
from .models import Category, Property, PropertyImage
from .serializers import (
    CategorySerializer,
    PropertyCreateUpdateSerializer,
    PropertyDetailSerializer,
    PropertyImageSerializer,
    PropertyListSerializer,
)


# ---------- Categories ----------


class CategoryListView(generics.ListAPIView):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [permissions.AllowAny]
    pagination_class = None


# ---------- Property list / create ----------


class PropertyListCreateView(generics.ListCreateAPIView):
    filterset_class = PropertyFilter
    search_fields = ["title", "address", "neighborhood"]
    ordering_fields = ["created_at", "area_m2", "bedrooms"]

    def get_permissions(self):
        if self.request.method == "GET":
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]

    def get_serializer_class(self):
        if self.request.method == "POST":
            return PropertyCreateUpdateSerializer
        return PropertyListSerializer

    def get_queryset(self):
        qs = Property.objects.select_related("category", "owner").prefetch_related(
            "images"
        )

        if self.request.user.is_authenticated and self.request.user.role == "admin":
            return qs.filter(is_deleted=False)

        if self.request.user.is_authenticated:
            # Authenticated users see active properties + their own
            from django.db.models import Q

            return qs.filter(
                Q(status="activo", is_deleted=False)
                | Q(owner=self.request.user, is_deleted=False)
            )

        return qs.filter(status="activo", is_deleted=False)

    def get_parsers(self):
        if self.request.method == "POST":
            return [MultiPartParser(), FormParser(), JSONParser()]
        return [JSONParser()]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        prop = serializer.save()
        output = PropertyDetailSerializer(prop, context={"request": request})
        return Response(output.data, status=status.HTTP_201_CREATED)


# ---------- Property detail / update / delete ----------


class PropertyDetailView(generics.RetrieveUpdateDestroyAPIView):
    lookup_field = "pk"
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_permissions(self):
        if self.request.method == "GET":
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated(), IsOwnerOrAdmin()]

    def get_serializer_class(self):
        if self.request.method in ("PUT", "PATCH"):
            return PropertyCreateUpdateSerializer
        return PropertyDetailSerializer

    def get_queryset(self):
        qs = Property.objects.select_related("category", "owner").prefetch_related(
            "images"
        )

        if self.request.user.is_authenticated and self.request.user.role == "admin":
            return qs.filter(is_deleted=False)

        if self.request.user.is_authenticated:
            from django.db.models import Q

            return qs.filter(
                Q(status="activo", is_deleted=False)
                | Q(owner=self.request.user, is_deleted=False)
            )

        return qs.filter(status="activo", is_deleted=False)

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop("partial", False)
        instance = self.get_object()
        serializer = PropertyCreateUpdateSerializer(
            instance, data=request.data, partial=partial, context={"request": request}
        )
        serializer.is_valid(raise_exception=True)
        prop = serializer.save()
        output = PropertyDetailSerializer(prop, context={"request": request})
        return Response(output.data)

    def destroy(self, request, *args, **kwargs):
        """Soft delete: set is_deleted=True instead of removing the row."""
        instance = self.get_object()
        instance.is_deleted = True
        instance.save(update_fields=["is_deleted"])
        return Response(status=status.HTTP_204_NO_CONTENT)


# ---------- Property images ----------


class PropertyImageUploadView(generics.CreateAPIView):
    serializer_class = PropertyImageSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def get_property(self):
        prop = Property.objects.get(pk=self.kwargs["property_pk"], is_deleted=False)
        return prop

    def create(self, request, *args, **kwargs):
        prop = self.get_property()

        # Only the owner can upload images
        if prop.owner != request.user and request.user.role != "admin":
            return Response(
                {"detail": "No tienes permiso para añadir imágenes a esta propiedad."},
                status=status.HTTP_403_FORBIDDEN,
            )

        image_file = request.FILES.get("image")
        if not image_file:
            return Response(
                {"detail": "No se proporcionó ninguna imagen."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        caption = request.data.get("caption", "")
        order = int(request.data.get("order", prop.images.count()))
        is_primary = request.data.get("is_primary", "false").lower() in (
            "true",
            "1",
        )

        img = PropertyImage.objects.create(
            property=prop,
            image=image_file,
            caption=caption,
            order=order,
            is_primary=is_primary,
        )

        serializer = PropertyImageSerializer(img, context={"request": request})
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class PropertyImageDeleteView(generics.DestroyAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return PropertyImage.objects.filter(
            property__pk=self.kwargs["property_pk"],
            property__is_deleted=False,
        )

    def get_object(self):
        img = self.get_queryset().get(pk=self.kwargs["image_pk"])
        prop = img.property

        # Only the owner can delete images
        if prop.owner != self.request.user and self.request.user.role != "admin":
            from rest_framework.exceptions import PermissionDenied

            raise PermissionDenied(
                "No tienes permiso para eliminar imágenes de esta propiedad."
            )
        return img
