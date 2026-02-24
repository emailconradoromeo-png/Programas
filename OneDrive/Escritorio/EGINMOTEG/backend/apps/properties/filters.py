import django_filters

from .models import Property


class PropertyFilter(django_filters.FilterSet):
    city = django_filters.CharFilter(field_name="city", lookup_expr="exact")
    category = django_filters.NumberFilter(field_name="category__id", lookup_expr="exact")
    bedrooms_min = django_filters.NumberFilter(field_name="bedrooms", lookup_expr="gte")
    bathrooms_min = django_filters.NumberFilter(field_name="bathrooms", lookup_expr="gte")
    status = django_filters.CharFilter(field_name="status", lookup_expr="exact")
    area_min = django_filters.NumberFilter(field_name="area_m2", lookup_expr="gte")
    area_max = django_filters.NumberFilter(field_name="area_m2", lookup_expr="lte")

    class Meta:
        model = Property
        fields = ["city", "category", "bedrooms_min", "bathrooms_min", "status"]
