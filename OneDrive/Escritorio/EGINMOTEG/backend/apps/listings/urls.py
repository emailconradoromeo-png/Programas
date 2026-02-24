from django.urls import path

from . import views

app_name = "listings"

urlpatterns = [
    # Listing CRUD
    path("", views.ListingListView.as_view(), name="listing-list"),
    path("create/", views.ListingCreateView.as_view(), name="listing-create"),
    path("<uuid:id>/", views.ListingDetailView.as_view(), name="listing-detail"),
    path("<uuid:id>/update/", views.ListingUpdateView.as_view(), name="listing-update"),
    # Favorites
    path(
        "<uuid:id>/favorite/",
        views.FavoriteToggleView.as_view(),
        name="listing-favorite",
    ),
    path("favorites/", views.FavoriteListView.as_view(), name="favorite-list"),
    # My listings
    path("my-listings/", views.MyListingsView.as_view(), name="my-listings"),
]
