from django.contrib import admin

from .models import Payment, Subscription, SubscriptionPlan


@admin.register(SubscriptionPlan)
class SubscriptionPlanAdmin(admin.ModelAdmin):
    list_display = ("name", "slug", "price_xaf", "price_eur", "duration_days", "max_listings", "is_active")
    list_filter = ("is_active",)
    search_fields = ("name", "slug")
    prepopulated_fields = {"slug": ("name",)}


@admin.register(Subscription)
class SubscriptionAdmin(admin.ModelAdmin):
    list_display = ("user", "plan", "status", "starts_at", "expires_at", "auto_renew", "created_at")
    list_filter = ("status", "auto_renew", "plan")
    search_fields = ("user__username", "user__email")
    raw_id_fields = ("user",)
    readonly_fields = ("created_at",)


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ("reference", "user", "amount", "currency", "payment_method", "status", "created_at")
    list_filter = ("status", "currency", "payment_method")
    search_fields = ("reference", "user__username", "user__email")
    raw_id_fields = ("user", "subscription")
    readonly_fields = ("id", "created_at")
