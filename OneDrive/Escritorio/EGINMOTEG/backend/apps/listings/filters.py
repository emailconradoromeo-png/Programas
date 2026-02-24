import django_filters

from .models import Listing


class ListingFilter(django_filters.FilterSet):
    operation_type = django_filters.ChoiceFilter(
        choices=Listing.OPERATION_TYPE_CHOICES,
    )
    price_xaf__gte = django_filters.NumberFilter(
        field_name="price_xaf",
        lookup_expr="gte",
        label="Precio mínimo (XAF)",
    )
    price_xaf__lte = django_filters.NumberFilter(
        field_name="price_xaf",
        lookup_expr="lte",
        label="Precio máximo (XAF)",
    )
    city = django_filters.CharFilter(
        field_name="property__city",
        lookup_expr="iexact",
        label="Ciudad",
    )
    category = django_filters.CharFilter(
        field_name="property__category__slug",
        lookup_expr="iexact",
        label="Categoría",
    )
    bedrooms__gte = django_filters.NumberFilter(
        field_name="property__bedrooms",
        lookup_expr="gte",
        label="Dormitorios mínimos",
    )
    status = django_filters.ChoiceFilter(
        choices=Listing.STATUS_CHOICES,
    )

    class Meta:
        model = Listing
        fields = [
            "operation_type",
            "price_xaf__gte",
            "price_xaf__lte",
            "city",
            "category",
            "bedrooms__gte",
            "status",
        ]
