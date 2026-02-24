from rest_framework.permissions import BasePermission


class IsAdmin(BasePermission):
    """Allow access only to admin users."""

    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.role == "admin"


class IsAgent(BasePermission):
    """Allow access to agents or admins."""

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role in ("agente", "admin")
        )


class IsOwnerOrAdmin(BasePermission):
    """Allow access to the object owner or an admin."""

    def has_object_permission(self, request, view, obj):
        if request.user.role == "admin":
            return True
        if hasattr(obj, "owner"):
            return obj.owner == request.user
        if hasattr(obj, "user"):
            return obj.user == request.user
        if hasattr(obj, "posted_by"):
            return obj.posted_by == request.user
        return False


class IsVerified(BasePermission):
    """Allow access only to verified users."""

    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.is_verified


class IsOwnerOrReadOnly(BasePermission):
    """Allow owners to edit, everyone else read-only."""

    def has_object_permission(self, request, view, obj):
        if request.method in ("GET", "HEAD", "OPTIONS"):
            return True
        if hasattr(obj, "owner"):
            return obj.owner == request.user
        if hasattr(obj, "user"):
            return obj.user == request.user
        if hasattr(obj, "posted_by"):
            return obj.posted_by == request.user
        return False
