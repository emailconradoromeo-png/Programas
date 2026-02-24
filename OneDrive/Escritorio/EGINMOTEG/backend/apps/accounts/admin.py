from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin

from .models import KYCDocument, User, UserProfile


class UserProfileInline(admin.StackedInline):
    model = UserProfile
    can_delete = False


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ("username", "email", "role", "is_verified", "is_active", "date_joined")
    list_filter = ("role", "is_verified", "is_active", "language")
    search_fields = ("username", "email", "first_name", "last_name", "phone")
    inlines = [UserProfileInline]
    fieldsets = BaseUserAdmin.fieldsets + (
        ("Información adicional", {
            "fields": ("phone", "role", "language", "preferred_currency", "is_verified"),
        }),
    )


@admin.register(KYCDocument)
class KYCDocumentAdmin(admin.ModelAdmin):
    list_display = ("user", "document_type", "status", "created_at", "reviewed_at")
    list_filter = ("status", "document_type")
    search_fields = ("user__username", "user__email")
    raw_id_fields = ("user", "reviewed_by")
