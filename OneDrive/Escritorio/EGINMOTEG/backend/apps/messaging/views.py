from django.conf import settings
from django.contrib.auth import get_user_model
from django.db.models import Q
from django.shortcuts import get_object_or_404
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Conversation, Message, Notification
from .serializers import (
    ConversationDetailSerializer,
    ConversationListSerializer,
    CreateConversationSerializer,
    MessageSerializer,
    NotificationSerializer,
    SendMessageSerializer,
)

User = get_user_model()


class ConversationListView(generics.ListAPIView):
    """GET /conversations/ -- list conversations for the authenticated user."""

    serializer_class = ConversationListSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return (
            Conversation.objects.filter(participants=self.request.user)
            .prefetch_related("participants", "messages")
            .select_related("listing")
            .distinct()
        )


class ConversationCreateView(APIView):
    """POST /conversations/ -- create a conversation with an initial message."""

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = CreateConversationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        participant_id = serializer.validated_data["participant_id"]
        listing_id = serializer.validated_data.get("listing_id")
        initial_message = serializer.validated_data["initial_message"]

        # Validate participant exists
        participant = get_object_or_404(User, id=participant_id)

        if participant == request.user:
            return Response(
                {"detail": "No puedes crear una conversación contigo mismo."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Check for existing conversation between the same participants and listing
        existing_qs = Conversation.objects.filter(
            participants=request.user
        ).filter(participants=participant)

        if listing_id:
            existing_qs = existing_qs.filter(listing_id=listing_id)
        else:
            existing_qs = existing_qs.filter(listing__isnull=True)

        existing = existing_qs.first()
        if existing:
            # Add message to existing conversation
            Message.objects.create(
                conversation=existing,
                sender=request.user,
                content=initial_message,
            )
            existing.save()  # triggers updated_at
            data = ConversationDetailSerializer(
                existing, context={"request": request}
            ).data
            return Response(data, status=status.HTTP_200_OK)

        # Create new conversation
        listing = None
        if listing_id:
            from django.apps import apps

            Listing = apps.get_model("listings", "Listing")
            listing = get_object_or_404(Listing, id=listing_id)

        conversation = Conversation.objects.create(listing=listing)
        conversation.participants.add(request.user, participant)

        Message.objects.create(
            conversation=conversation,
            sender=request.user,
            content=initial_message,
        )

        data = ConversationDetailSerializer(
            conversation, context={"request": request}
        ).data
        return Response(data, status=status.HTTP_201_CREATED)


class ConversationMessagesView(APIView):
    """
    GET  /conversations/{id}/messages/ -- retrieve messages (participants only).
    POST /conversations/{id}/messages/ -- send a message (participants only).
    """

    permission_classes = [permissions.IsAuthenticated]

    def _get_conversation(self, conversation_id, user):
        conversation = get_object_or_404(Conversation, id=conversation_id)
        if not conversation.participants.filter(id=user.id).exists():
            return None
        return conversation

    def get(self, request, conversation_id):
        conversation = self._get_conversation(conversation_id, request.user)
        if conversation is None:
            return Response(
                {"detail": "No tienes acceso a esta conversación."},
                status=status.HTTP_403_FORBIDDEN,
            )

        # Mark messages from other participants as read
        conversation.messages.filter(is_read=False).exclude(
            sender=request.user
        ).update(is_read=True)

        messages = conversation.messages.select_related("sender").all()
        serializer = MessageSerializer(messages, many=True)
        return Response(serializer.data)

    def post(self, request, conversation_id):
        conversation = self._get_conversation(conversation_id, request.user)
        if conversation is None:
            return Response(
                {"detail": "No tienes acceso a esta conversación."},
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = SendMessageSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        message = Message.objects.create(
            conversation=conversation,
            sender=request.user,
            content=serializer.validated_data["content"],
        )
        conversation.save()  # triggers updated_at

        return Response(
            MessageSerializer(message).data,
            status=status.HTTP_201_CREATED,
        )


class NotificationListView(generics.ListAPIView):
    """GET /notifications/ -- list notifications for the authenticated user."""

    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user)


class NotificationMarkReadView(APIView):
    """PATCH /notifications/{id}/read/ -- mark a notification as read."""

    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request, notification_id):
        notification = get_object_or_404(
            Notification, id=notification_id, user=request.user
        )
        notification.is_read = True
        notification.save(update_fields=["is_read"])
        return Response(NotificationSerializer(notification).data)
