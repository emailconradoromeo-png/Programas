from django.urls import path

from . import views

app_name = "search"

urlpatterns = [
    path("", views.SearchView.as_view(), name="search"),
    path("map/", views.MapSearchView.as_view(), name="map-search"),
    path("suggestions/", views.SuggestionsView.as_view(), name="suggestions"),
]
