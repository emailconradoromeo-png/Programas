from django.contrib import admin

from .models import (
    ChatMessage,
    ChatSession,
    ImageAnalysis,
    PropertyValuation,
    Recommendation,
    SearchHistory,
)


@admin.register(PropertyValuation)
class PropertyValuationAdmin(admin.ModelAdmin):
    list_display = ("property", "estimated_price_xaf", "confidence_score", "created_at")
    list_filter = ("confidence_score",)
    search_fields = ("property__title",)
    readonly_fields = ("created_at",)


@admin.register(SearchHistory)
class SearchHistoryAdmin(admin.ModelAdmin):
    list_display = ("user", "query", "created_at")
    list_filter = ("created_at",)
    search_fields = ("user__username", "query")
    readonly_fields = ("created_at",)


@admin.register(Recommendation)
class RecommendationAdmin(admin.ModelAdmin):
    list_display = ("user", "listing", "score", "created_at")
    list_filter = ("score",)
    search_fields = ("user__username",)
    readonly_fields = ("created_at",)


@admin.register(ChatSession)
class ChatSessionAdmin(admin.ModelAdmin):
    list_display = ("user", "title", "created_at", "updated_at")
    search_fields = ("user__username", "title")
    readonly_fields = ("created_at", "updated_at")


@admin.register(ChatMessage)
class ChatMessageAdmin(admin.ModelAdmin):
    list_display = ("session", "role", "short_content", "created_at")
    list_filter = ("role",)
    readonly_fields = ("created_at",)

    def short_content(self, obj):
        return obj.content[:80] + "..." if len(obj.content) > 80 else obj.content

    short_content.short_description = "Contenido"


@admin.register(ImageAnalysis)
class ImageAnalysisAdmin(admin.ModelAdmin):
    list_display = ("property_image", "room_type", "quality_score", "status", "created_at")
    list_filter = ("status", "room_type")
    readonly_fields = ("created_at",)
