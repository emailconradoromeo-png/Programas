from django.urls import path

from . import views

app_name = "accounts"

urlpatterns = [
    # Auth
    path("register/", views.RegisterView.as_view(), name="register"),
    path("login/", views.LoginView.as_view(), name="login"),
    path("token/refresh/", views.TokenRefresh.as_view(), name="token-refresh"),
    # Profile
    path("me/", views.MeView.as_view(), name="me"),
    path("me/kyc/", views.KYCUploadView.as_view(), name="kyc-upload"),
    # Admin
    path("admin/users/", views.AdminUserListView.as_view(), name="admin-users"),
    path(
        "admin/users/<uuid:user_id>/verify/",
        views.admin_verify_user,
        name="admin-verify-user",
    ),
    path("admin/kyc/pending/", views.AdminKYCPendingView.as_view(), name="admin-kyc-pending"),
    path(
        "admin/kyc/<int:kyc_id>/review/",
        views.admin_review_kyc,
        name="admin-kyc-review",
    ),
]
