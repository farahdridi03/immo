from django.urls import path
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView

from .views import (
    ChangePasswordView,
    Confirm2FAView,
    CustomTokenObtainPairView,
    DepartementViewSet,
    Disable2FAView,
    EntrepriseViewSet,
    MeView,
    PermissionViewSet,
    RegisterView,
    RolePermissionViewSet,
    RoleViewSet,
    Setup2FAView,
    UserPreferenceView,
    UserViewSet,
    Verify2FALoginView,
)

router = DefaultRouter()

router.register(
    r"entreprises",
    EntrepriseViewSet,
    basename="entreprise",
)
router.register(
    r"departements",
    DepartementViewSet,
    basename="departement",
)
router.register(
    r"roles",
    RoleViewSet,
    basename="role",
)
router.register(
    r"permissions",
    PermissionViewSet,
    basename="permission",
)
router.register(
    r"role-permissions",
    RolePermissionViewSet,
    basename="role-permission",
)
router.register(
    r"users",
    UserViewSet,
    basename="user",
)

urlpatterns = [
    path(
        "auth/register/",
        RegisterView.as_view(),
        name="auth_register",
    ),
    path(
        "auth/login/",
        CustomTokenObtainPairView.as_view(),
        name="token_obtain_pair",
    ),
    path(
        "auth/login/2fa/",
        Verify2FALoginView.as_view(),
        name="auth_verify_2fa_login",
    ),
    path(
        "auth/refresh/",
        TokenRefreshView.as_view(),
        name="token_refresh",
    ),
    path(
        "auth/me/",
        MeView.as_view(),
        name="auth_me",
    ),
    path(
        "auth/preferences/",
        UserPreferenceView.as_view(),
        name="auth_preferences",
    ),
    path(
        "auth/change-password/",
        ChangePasswordView.as_view(),
        name="auth_change_password",
    ),
    path(
        "auth/2fa/setup/",
        Setup2FAView.as_view(),
        name="auth_2fa_setup",
    ),
    path(
        "auth/2fa/confirm/",
        Confirm2FAView.as_view(),
        name="auth_2fa_confirm",
    ),
    path(
        "auth/2fa/disable/",
        Disable2FAView.as_view(),
        name="auth_2fa_disable",
    ),
] + router.urls