from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers

from .models import KYCDocument, User, UserProfile


class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = [
            "avatar",
            "bio",
            "company_name",
            "license_number",
            "address",
            "city",
            "reputation_score",
            "total_reviews",
        ]
        read_only_fields = ["reputation_score", "total_reviews"]


class UserSerializer(serializers.ModelSerializer):
    profile = UserProfileSerializer(read_only=True)

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "phone",
            "role",
            "language",
            "preferred_currency",
            "is_verified",
            "date_joined",
            "profile",
        ]
        read_only_fields = ["id", "is_verified", "date_joined"]


class UserUpdateSerializer(serializers.ModelSerializer):
    profile = UserProfileSerializer(required=False)

    class Meta:
        model = User
        fields = [
            "first_name",
            "last_name",
            "phone",
            "language",
            "preferred_currency",
            "profile",
        ]

    def update(self, instance, validated_data):
        profile_data = validated_data.pop("profile", None)
        instance = super().update(instance, validated_data)

        if profile_data:
            profile, _ = UserProfile.objects.get_or_create(user=instance)
            for attr, value in profile_data.items():
                setattr(profile, attr, value)
            profile.save()

        return instance


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, validators=[validate_password])
    password_confirm = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = [
            "username",
            "email",
            "password",
            "password_confirm",
            "first_name",
            "last_name",
            "phone",
            "role",
            "language",
        ]

    def validate(self, attrs):
        if attrs["password"] != attrs.pop("password_confirm"):
            raise serializers.ValidationError(
                {"password_confirm": "Las contraseñas no coinciden."}
            )
        return attrs

    def create(self, validated_data):
        password = validated_data.pop("password")
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        UserProfile.objects.create(user=user)
        return user


class PasswordResetRequestSerializer(serializers.Serializer):
    email = serializers.EmailField()


class PasswordResetConfirmSerializer(serializers.Serializer):
    token = serializers.CharField()
    uid = serializers.CharField()
    new_password = serializers.CharField(validators=[validate_password])


class KYCDocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = KYCDocument
        fields = [
            "id",
            "document_type",
            "document_file",
            "status",
            "reviewed_by",
            "reviewed_at",
            "notes",
            "created_at",
        ]
        read_only_fields = ["id", "status", "reviewed_by", "reviewed_at", "created_at"]


class KYCReviewSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=["aprobado", "rechazado"])
    notes = serializers.CharField(required=False, default="")


class UserAdminSerializer(serializers.ModelSerializer):
    """Serializer for admin user management."""

    profile = UserProfileSerializer(read_only=True)

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "phone",
            "role",
            "language",
            "preferred_currency",
            "is_verified",
            "is_active",
            "date_joined",
            "profile",
        ]
        read_only_fields = ["id", "date_joined"]
