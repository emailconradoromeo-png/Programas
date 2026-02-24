from django.db.models import F
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.core.permissions import IsOwnerOrAdmin

from .filters import ListingFilter
from .models import Favorite, Listing
from .serializers import (
    FavoriteSerializer,
    ListingCreateUpdateSerializer,
    ListingDetailSerializer,
    ListingListSerializer,
)


# ---------------------------------------------------------------------------
# Listing endpoints
# ---------------------------------------------------------------------------


class ListingListView(generics.ListAPIView):
    """GET / - List active listings with filters. Public access."""

    serializer_class = ListingListSerializer
    permission_classes = [permissions.AllowAny]
    filterset_class = ListingFilter
    search_fields = ["property__title", "property__city", "property__address"]
    ordering_fields = ["price_xaf", "created_at", "views_count"]
    ordering = ["-created_at"]

    def get_queryset(self):
        return (
            Listing.objects.filter(status="activo")
            .select_related("property", "property__category", "posted_by")
            .order_by("-is_featured", "-created_at")
        )


class ListingCreateView(generics.CreateAPIView):
    """POST / - Create a new listing. Authenticated users only."""

    serializer_class = ListingCreateUpdateSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(posted_by=self.request.user)

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        # Return the full detail representation.
        detail = ListingDetailSerializer(
            serializer.instance,
            context={"request": request},
        )
        return Response(detail.data, status=status.HTTP_201_CREATED)


class ListingDetailView(generics.RetrieveAPIView):
    """GET /{id}/ - Listing detail. Public access. Increments views_count."""

    serializer_class = ListingDetailSerializer
    permission_classes = [permissions.AllowAny]
    lookup_field = "id"

    def get_queryset(self):
        return Listing.objects.select_related("property", "property__category", "posted_by")

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        # Atomically increment views_count.
        Listing.objects.filter(id=instance.id).update(views_count=F("views_count") + 1)
        instance.refresh_from_db()
        serializer = self.get_serializer(instance)
        return Response(serializer.data)


class ListingUpdateView(generics.UpdateAPIView):
    """PATCH /{id}/ - Update a listing. Owner or admin only."""

    serializer_class = ListingCreateUpdateSerializer
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrAdmin]
    lookup_field = "id"
    http_method_names = ["patch"]

    def get_queryset(self):
        return Listing.objects.select_related("property", "posted_by")

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop("partial", True)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        detail = ListingDetailSerializer(
            serializer.instance,
            context={"request": request},
        )
        return Response(detail.data)


# ---------------------------------------------------------------------------
# Favorite endpoints
# ---------------------------------------------------------------------------


class FavoriteToggleView(APIView):
    """
    POST /{id}/favorite/   - Add listing to favourites.
    DELETE /{id}/favorite/  - Remove listing from favourites.
    """

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, id):
        try:
            listing = Listing.objects.get(id=id)
        except Listing.DoesNotExist:
            return Response(
                {"detail": "Anuncio no encontrado."},
                status=status.HTTP_404_NOT_FOUND,
            )

        _, created = Favorite.objects.get_or_create(
            user=request.user,
            listing=listing,
        )
        if not created:
            return Response(
                {"detail": "El anuncio ya está en favoritos."},
                status=status.HTTP_200_OK,
            )
        return Response(
            {"detail": "Anuncio agregado a favoritos."},
            status=status.HTTP_201_CREATED,
        )

    def delete(self, request, id):
        deleted_count, _ = Favorite.objects.filter(
            user=request.user,
            listing_id=id,
        ).delete()
        if deleted_count == 0:
            return Response(
                {"detail": "El anuncio no estaba en favoritos."},
                status=status.HTTP_404_NOT_FOUND,
            )
        return Response(status=status.HTTP_204_NO_CONTENT)


class FavoriteListView(generics.ListAPIView):
    """GET /favorites/ - Current user's favorites. Authenticated only."""

    serializer_class = FavoriteSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return (
            Favorite.objects.filter(user=self.request.user)
            .select_related("listing__property", "listing__posted_by")
        )


class MyListingsView(generics.ListAPIView):
    """GET /my-listings/ - Current user's own listings. Authenticated only."""

    serializer_class = ListingListSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_class = ListingFilter
    ordering_fields = ["price_xaf", "created_at", "views_count"]
    ordering = ["-created_at"]

    def get_queryset(self):
        return (
            Listing.objects.filter(posted_by=self.request.user)
            .select_related("property", "posted_by")
        )
