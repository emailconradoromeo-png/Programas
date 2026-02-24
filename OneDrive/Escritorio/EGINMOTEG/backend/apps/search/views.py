from django.contrib.gis.geos import Point, Polygon
from django.contrib.gis.measure import D
from django.db.models import Q, Value
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.core.pagination import StandardPagination
from apps.listings.models import Listing
from apps.properties.models import Property

from .serializers import SearchResultSerializer


# ---------------------------------------------------------------------------
# Helper: base queryset for active, non-deleted listings
# ---------------------------------------------------------------------------


def _active_listings_qs():
    """Return a queryset of active listings whose property is not deleted."""
    return (
        Listing.objects.filter(
            status="activo",
            property__is_deleted=False,
        )
        .select_related("property")
        .prefetch_related("property__images")
    )


# ---------------------------------------------------------------------------
# 1. Full-text search with filters
# ---------------------------------------------------------------------------


class SearchView(generics.ListAPIView):
    """
    GET /api/search/

    Full-text search across listings with filters.

    Query parameters
    ----------------
    q            : str   - Free-text search (title, description, address, neighborhood)
    price_min    : float - Minimum price (uses price_xaf for normalised comparison)
    price_max    : float - Maximum price (uses price_xaf for normalised comparison)
    city         : str   - City slug (e.g. "malabo", "bata")
    bedrooms     : int   - Minimum number of bedrooms
    category     : str   - Category id or slug
    operation_type : str - "venta", "alquiler", "alquiler_vacacional"
    currency     : str   - "XAF", "EUR", "USD"
    """

    serializer_class = SearchResultSerializer
    permission_classes = [permissions.AllowAny]
    pagination_class = StandardPagination

    def get_queryset(self):
        qs = _active_listings_qs()
        params = self.request.query_params

        # --- Free-text search ---
        q = params.get("q", "").strip()
        if q:
            qs = qs.filter(
                Q(property__title__icontains=q)
                | Q(property__description__icontains=q)
                | Q(property__address__icontains=q)
                | Q(property__neighborhood__icontains=q)
            )

        # --- Price range (normalised XAF) ---
        price_min = params.get("price_min")
        if price_min is not None:
            try:
                qs = qs.filter(price_xaf__gte=float(price_min))
            except (ValueError, TypeError):
                pass

        price_max = params.get("price_max")
        if price_max is not None:
            try:
                qs = qs.filter(price_xaf__lte=float(price_max))
            except (ValueError, TypeError):
                pass

        # --- City ---
        city = params.get("city", "").strip()
        if city:
            qs = qs.filter(property__city__iexact=city)

        # --- Bedrooms (minimum) ---
        bedrooms = params.get("bedrooms")
        if bedrooms is not None:
            try:
                qs = qs.filter(property__bedrooms__gte=int(bedrooms))
            except (ValueError, TypeError):
                pass

        # --- Category (by id or slug) ---
        category = params.get("category", "").strip()
        if category:
            qs = qs.filter(
                Q(property__category__id__iexact=category)
                | Q(property__category__slug__iexact=category)
            )

        # --- Operation type ---
        operation_type = params.get("operation_type", "").strip()
        if operation_type:
            qs = qs.filter(operation_type__iexact=operation_type)

        # --- Currency ---
        currency = params.get("currency", "").strip()
        if currency:
            qs = qs.filter(currency__iexact=currency)

        # Featured listings first, then most recent
        return qs.order_by("-is_featured", "-created_at")


# ---------------------------------------------------------------------------
# 2. Geospatial / map search
# ---------------------------------------------------------------------------


class MapSearchView(generics.ListAPIView):
    """
    GET /api/search/map/

    Geospatial search for listings.  Accepts either a bounding-box *or* a
    centre + radius.

    Query parameters
    ----------------
    bbox   : str   - Bounding box as "min_lng,min_lat,max_lng,max_lat"
    center : str   - Centre point as "lng,lat"
    radius : float - Radius in kilometres (default 5, used with center)
    """

    serializer_class = SearchResultSerializer
    permission_classes = [permissions.AllowAny]
    pagination_class = StandardPagination

    def get_queryset(self):
        qs = _active_listings_qs().filter(property__location__isnull=False)
        params = self.request.query_params

        # --- Bounding-box mode ---
        bbox = params.get("bbox", "").strip()
        if bbox:
            try:
                min_lng, min_lat, max_lng, max_lat = [
                    float(v) for v in bbox.split(",")
                ]
                bbox_polygon = Polygon.from_bbox(
                    (min_lng, min_lat, max_lng, max_lat)
                )
                bbox_polygon.srid = 4326
                qs = qs.filter(property__location__within=bbox_polygon)
            except (ValueError, TypeError):
                return qs.none()
            return qs.order_by("-is_featured", "-created_at")

        # --- Centre + radius mode ---
        center = params.get("center", "").strip()
        if center:
            try:
                lng, lat = [float(v) for v in center.split(",")]
                point = Point(lng, lat, srid=4326)
            except (ValueError, TypeError):
                return qs.none()

            try:
                radius_km = float(params.get("radius", 5))
            except (ValueError, TypeError):
                radius_km = 5.0

            qs = qs.filter(
                property__location__dwithin=(point, D(km=radius_km))
            )
            return qs.order_by("-is_featured", "-created_at")

        # No spatial filter supplied - return all located listings
        return qs.order_by("-is_featured", "-created_at")


# ---------------------------------------------------------------------------
# 3. Autocomplete / suggestions
# ---------------------------------------------------------------------------


class SuggestionsView(APIView):
    """
    GET /api/search/suggestions/?q=...

    Returns up to 10 autocomplete suggestions drawn from property titles,
    cities, and neighborhoods.
    """

    permission_classes = [permissions.AllowAny]

    def get(self, request, *args, **kwargs):
        q = request.query_params.get("q", "").strip()
        if not q or len(q) < 2:
            return Response({"suggestions": []})

        suggestions = []

        # --- Titles ---
        title_matches = (
            Property.objects.filter(
                is_deleted=False,
                title__icontains=q,
            )
            .values_list("title", flat=True)
            .distinct()[:10]
        )
        for title in title_matches:
            suggestions.append({"type": "title", "text": title})

        # --- Cities ---
        city_matches = (
            Property.objects.filter(
                is_deleted=False,
                city__icontains=q,
            )
            .values_list("city", flat=True)
            .distinct()[:5]
        )
        # Map the stored slug to the human-readable display label.
        city_display = dict(Property.CITY_CHOICES)
        for city in city_matches:
            display = city_display.get(city, city)
            suggestions.append({"type": "city", "text": display, "value": city})

        # --- Neighborhoods ---
        neighborhood_matches = (
            Property.objects.filter(
                is_deleted=False,
                neighborhood__icontains=q,
            )
            .exclude(neighborhood="")
            .values_list("neighborhood", flat=True)
            .distinct()[:5]
        )
        for neighborhood in neighborhood_matches:
            suggestions.append({"type": "neighborhood", "text": neighborhood})

        # Limit total suggestions to 10
        return Response({"suggestions": suggestions[:10]})
