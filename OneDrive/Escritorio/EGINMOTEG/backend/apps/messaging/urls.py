from django.urls import path

from . import views

app_name = "messaging"

urlpatterns = [
    # Conversations
    path(
        "conversations/",
        views.ConversationListView.as_view(),
        name="conversation-list",
    ),
    path(
        "conversations/create/",
        views.ConversationCreateView.as_view(),
        name="conversation-create",
    ),
    path(
        "conversations/<uuid:conversation_id>/messages/",
        views.ConversationMessagesView.as_view(),
        name="conversation-messages",
    ),
    # Notifications
    path(
        "notifications/",
        views.NotificationListView.as_view(),
        name="notification-list",
    ),
    path(
        "notifications/<int:notification_id>/read/",
        views.NotificationMarkReadView.as_view(),
        name="notification-mark-read",
    ),
]
