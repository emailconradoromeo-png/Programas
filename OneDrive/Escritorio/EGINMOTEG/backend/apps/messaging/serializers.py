from rest_framework import serializers

from .models import Conversation, Message, Notification


class ParticipantSerializer(serializers.Serializer):
    """Lightweight user representation for conversation participants."""

    id = serializers.UUIDField(read_only=True)
    username = serializers.CharField(read_only=True)
    first_name = serializers.CharField(read_only=True)
    last_name = serializers.CharField(read_only=True)


class MessageSerializer(serializers.ModelSerializer):
    sender = ParticipantSerializer(read_only=True)

    class Meta:
        model = Message
        fields = ["id", "sender", "content", "is_read", "created_at"]
        read_only_fields = ["id", "sender", "is_read", "created_at"]


class ListingBasicSerializer(serializers.Serializer):
    """Lightweight listing info embedded in conversations."""

    id = serializers.UUIDField(read_only=True)
    title = serializers.CharField(read_only=True)


class ConversationListSerializer(serializers.ModelSerializer):
    listing = ListingBasicSerializer(read_only=True)
    participants = ParticipantSerializer(many=True, read_only=True)
    last_message = serializers.SerializerMethodField()
    unread_count = serializers.SerializerMethodField()

    class Meta:
        model = Conversation
        fields = [
            "id",
            "listing",
            "participants",
            "last_message",
            "unread_count",
            "created_at",
            "updated_at",
        ]
        read_only_fields = fields

    def get_last_message(self, obj):
        last = obj.messages.order_by("-created_at").first()
        if last:
            return MessageSerializer(last).data
        return None

    def get_unread_count(self, obj):
        request = self.context.get("request")
        if request and request.user:
            return obj.messages.filter(is_read=False).exclude(
                sender=request.user
            ).count()
        return 0


class ConversationDetailSerializer(serializers.ModelSerializer):
    listing = ListingBasicSerializer(read_only=True)
    participants = ParticipantSerializer(many=True, read_only=True)
    messages = MessageSerializer(many=True, read_only=True)

    class Meta:
        model = Conversation
        fields = [
            "id",
            "listing",
            "participants",
            "messages",
            "created_at",
            "updated_at",
        ]
        read_only_fields = fields


class CreateConversationSerializer(serializers.Serializer):
    listing_id = serializers.UUIDField(required=False, allow_null=True)
    participant_id = serializers.UUIDField()
    initial_message = serializers.CharField()


class SendMessageSerializer(serializers.Serializer):
    content = serializers.CharField()


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = [
            "id",
            "user",
            "type",
            "title",
            "message",
            "is_read",
            "action_url",
            "created_at",
        ]
        read_only_fields = ["id", "user", "type", "title", "message", "action_url", "created_at"]
