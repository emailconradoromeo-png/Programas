from django.contrib import admin

from .models import Category, Property, PropertyImage


class PropertyImageInline(admin.TabularInline):
    model = PropertyImage
    extra = 1
    fields = ("image", "thumbnail", "caption", "order", "is_primary")


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ("name", "slug", "icon")
    search_fields = ("name",)
    prepopulated_fields = {"slug": ("name",)}


@admin.register(Property)
class PropertyAdmin(admin.ModelAdmin):
    list_display = (
        "title",
        "owner",
        "category",
        "city",
        "status",
        "is_verified",
        "is_deleted",
        "created_at",
    )
    list_filter = ("status", "city", "category", "is_verified", "is_deleted")
    search_fields = ("title", "address", "neighborhood", "owner__username")
    raw_id_fields = ("owner", "verified_by")
    readonly_fields = ("created_at", "updated_at")
    inlines = [PropertyImageInline]
    fieldsets = (
        (None, {
            "fields": ("title", "description", "category", "owner"),
        }),
        ("Ubicación", {
            "fields": ("location", "address", "city", "neighborhood"),
        }),
        ("Características", {
            "fields": ("area_m2", "bedrooms", "bathrooms", "floors", "year_built"),
        }),
        ("Atributos extra", {
            "fields": ("extra_attributes",),
            "classes": ("collapse",),
        }),
        ("Estado", {
            "fields": (
                "status",
                "is_verified",
                "verified_by",
                "is_deleted",
            ),
        }),
        ("Fechas", {
            "fields": ("created_at", "updated_at"),
        }),
    )


@admin.register(PropertyImage)
class PropertyImageAdmin(admin.ModelAdmin):
    list_display = ("property", "caption", "order", "is_primary")
    list_filter = ("is_primary",)
    search_fields = ("property__title", "caption")
    raw_id_fields = ("property",)
