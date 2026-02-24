from django.urls import path

from . import views

app_name = "payments"

urlpatterns = [
    path("plans/", views.SubscriptionPlanListView.as_view(), name="plan-list"),
    path("subscribe/", views.SubscribeView.as_view(), name="subscribe"),
    path(
        "my-subscription/",
        views.MySubscriptionView.as_view(),
        name="my-subscription",
    ),
    path("history/", views.PaymentHistoryView.as_view(), name="payment-history"),
]
