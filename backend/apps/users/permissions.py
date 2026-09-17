from rest_framework.permissions import BasePermission


class CanManageUsers(BasePermission):
    """
    Permission permettant de gérer les utilisateurs.

    Autorisé si :
    - l'utilisateur est superuser
    - OU est admin d'entreprise
    - OU possède la permission 'manage_users' via son rôle
    """

    message = "Vous n'avez pas la permission de gérer les utilisateurs."

    def has_permission(self, request, view):
        user = request.user

        if not user or not user.is_authenticated:
            return False

        if user.is_superuser or getattr(user, "est_admin_entreprise", False):
            return True

        if getattr(user, "role", None):
            if user.role.permissions.filter(code__in=["manage_users", "users.manage_users"]).exists():
                return True

        return user.has_perm("users.manage_users")