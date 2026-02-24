from django.urls import path

from . import views

app_name = "ai"

urlpatterns = [
    # Valoraciones
    path(
        "valuations/",
        views.RequestValuationView.as_view(),
        name="request-valuation",
    ),
    path(
        "valuations/<uuid:property_id>/",
        views.GetValuationView.as_view(),
        name="get-valuation",
    ),
    # Recomendaciones
    path(
        "recommendations/",
        views.RecommendationsView.as_view(),
        name="recommendations",
    ),
    # Chat
    path(
        "chat/",
        views.ChatView.as_view(),
        name="chat",
    ),
    path(
        "chat/sessions/",
        views.ChatSessionsListView.as_view(),
        name="chat-sessions",
    ),
    path(
        "chat/sessions/<uuid:session_id>/",
        views.ChatSessionDetailView.as_view(),
        name="chat-session-detail",
    ),
    # Análisis de imágenes
    path(
        "image-analysis/",
        views.RequestImageAnalysisView.as_view(),
        name="request-image-analysis",
    ),
    path(
        "image-analysis/<uuid:analysis_id>/",
        views.GetImageAnalysisView.as_view(),
        name="get-image-analysis",
    ),
]
