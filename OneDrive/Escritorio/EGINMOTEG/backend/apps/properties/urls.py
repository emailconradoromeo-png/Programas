from django.urls import path

from . import views

app_name = "properties"

urlpatterns = [
    # Categories
    path("categories/", views.CategoryListView.as_view(), name="category-list"),
    # Properties CRUD
    path("", views.PropertyListCreateView.as_view(), name="property-list-create"),
    path("<uuid:pk>/", views.PropertyDetailView.as_view(), name="property-detail"),
    # Property images
    path(
        "<uuid:property_pk>/images/",
        views.PropertyImageUploadView.as_view(),
        name="property-image-upload",
    ),
    path(
        "<uuid:property_pk>/images/<int:image_pk>/",
        views.PropertyImageDeleteView.as_view(),
        name="property-image-delete",
    ),
]
