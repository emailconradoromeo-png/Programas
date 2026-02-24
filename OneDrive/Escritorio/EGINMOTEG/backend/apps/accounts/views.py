from django.utils import timezone
from rest_framework import generics, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from apps.core.permissions import IsAdmin

from .models import KYCDocument, User
from .serializers import (
    KYCDocumentSerializer,
    KYCReviewSerializer,
    RegisterSerializer,
    UserAdminSerializer,
    UserSerializer,
    UserUpdateSerializer,
)


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = [permissions.AllowAny]
    serializer_class = RegisterSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response(
            UserSerializer(user).data,
            status=status.HTTP_201_CREATED,
        )


class LoginView(TokenObtainPairView):
    permission_classes = [permissions.AllowAny]


class TokenRefresh(TokenRefreshView):
    permission_classes = [permissions.AllowAny]


class MeView(generics.RetrieveUpdateAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user

    def get_serializer_class(self):
        if self.request.method in ("PUT", "PATCH"):
            return UserUpdateSerializer
        return UserSerializer


class KYCUploadView(generics.CreateAPIView):
    serializer_class = KYCDocumentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


# --- Admin endpoints ---


class AdminUserListView(generics.ListAPIView):
    queryset = User.objects.select_related("profile").all()
    serializer_class = UserAdminSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdmin]
    filterset_fields = ["role", "is_verified", "is_active"]
    search_fields = ["username", "email", "first_name", "last_name"]


@api_view(["PATCH"])
@permission_classes([permissions.IsAuthenticated, IsAdmin])
def admin_verify_user(request, user_id):
    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return Response(
            {"detail": "Usuario no encontrado."}, status=status.HTTP_404_NOT_FOUND
        )
    user.is_verified = True
    user.save(update_fields=["is_verified"])
    return Response(UserAdminSerializer(user).data)


class AdminKYCPendingView(generics.ListAPIView):
    queryset = KYCDocument.objects.filter(status="pendiente").select_related("user")
    serializer_class = KYCDocumentSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdmin]


@api_view(["PATCH"])
@permission_classes([permissions.IsAuthenticated, IsAdmin])
def admin_review_kyc(request, kyc_id):
    try:
        kyc = KYCDocument.objects.get(id=kyc_id)
    except KYCDocument.DoesNotExist:
        return Response(
            {"detail": "Documento no encontrado."}, status=status.HTTP_404_NOT_FOUND
        )

    serializer = KYCReviewSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    kyc.status = serializer.validated_data["status"]
    kyc.notes = serializer.validated_data.get("notes", "")
    kyc.reviewed_by = request.user
    kyc.reviewed_at = timezone.now()
    kyc.save()

    if kyc.status == "aprobado":
        kyc.user.is_verified = True
        kyc.user.save(update_fields=["is_verified"])

    return Response(KYCDocumentSerializer(kyc).data)
