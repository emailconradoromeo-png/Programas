from django.contrib import admin

from .models import Favorite, Listing


@admin.register(Listing)
class ListingAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "property",
        "posted_by",
        "operation_type",
        "price",
        "currency",
        "status",
        "is_featured",
        "views_count",
        "created_at",
    )
    list_filter = ("operation_type", "currency", "status", "is_featured")
    search_fields = (
        "property__title",
        "property__city",
        "posted_by__username",
        "posted_by__email",
    )
    raw_id_fields = ("property", "posted_by")
    readonly_fields = ("id", "views_count", "contacts_count", "created_at")
    list_editable = ("status", "is_featured")
    date_hierarchy = "created_at"


@admin.register(Favorite)
class FavoriteAdmin(admin.ModelAdmin):
    list_display = ("user", "listing", "created_at")
    search_fields = ("user__username", "user__email")
    raw_id_fields = ("user", "listing")
