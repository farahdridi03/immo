import base64
import io
import secrets
import pyotp
import qrcode
from django.core.signing import BadSignature, SignatureExpired, TimestampSigner
from django.utils import timezone
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.filters import OrderingFilter, SearchFilter
from rest_framework.permissions import AllowAny, DjangoModelPermissions, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView

from .models import Departement, Entreprise, Permission, Role, RolePermission, User, UserPreference
from .permissions import CanManageUsers
from .services import approve_entreprise, reject_entreprise
from .serializers import (
    ChangePasswordSerializer,
    CustomTokenObtainPairSerializer,
    DepartementSerializer,
    EntrepriseSerializer,
    PermissionSerializer,
    RegisterSerializer,
    RolePermissionSerializer,
    RoleSerializer,
    UserProfileUpdateSerializer,
    UserSerializer,
    UserPreferenceSerializer,
)


class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            return Response(
                {
                    "message": "Votre demande d'inscription a été transmise avec succès. Votre compte entreprise est actuellement en attente de validation par l'administrateur de la plateforme.",
                    "user_id": user.id,
                    "entreprise_id": user.entreprise.id if user.entreprise else None,
                },
                status=status.HTTP_201_CREATED,
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)

    def patch(self, request):
        serializer = UserProfileUpdateSerializer(request.user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(UserSerializer(request.user).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class UserPreferenceView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        prefs, _ = UserPreference.objects.get_or_create(user=request.user)
        serializer = UserPreferenceSerializer(prefs)
        return Response(serializer.data)

    def patch(self, request):
        prefs, _ = UserPreference.objects.get_or_create(user=request.user)
        serializer = UserPreferenceSerializer(prefs, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ChangePasswordView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data)
        if serializer.is_valid():
            user = request.user
            if not user.check_password(serializer.validated_data["old_password"]):
                return Response(
                    {"old_password": ["Mot de passe actuel incorrect."]},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            user.set_password(serializer.validated_data["new_password"])
            user.save()
            return Response({"detail": "Mot de passe modifié avec succès."})
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class Setup2FAView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        secret = pyotp.random_base32()
        user.two_factor_secret = secret
        user.save(update_fields=["two_factor_secret"])

        totp = pyotp.TOTP(secret)
        uri = totp.provisioning_uri(name=user.email or user.username, issuer_name="GestImmo")

        img = qrcode.make(uri)
        buffer = io.BytesIO()
        img.save(buffer)
        qr_base64 = "data:image/png;base64," + base64.b64encode(buffer.getvalue()).decode("utf-8")

        return Response({
            "secret": secret,
            "qr_code": qr_base64,
            "uri": uri,
        })


class Confirm2FAView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        code = str(request.data.get("code", "")).strip()

        if not user.two_factor_secret:
            return Response(
                {"detail": "Configuration 2FA non initialisée. Veuillez relancer la configuration."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        totp = pyotp.TOTP(user.two_factor_secret)
        if totp.verify(code, valid_window=1):
            backup_codes = [
                f"{secrets.token_hex(2).upper()}-{secrets.token_hex(2).upper()}"
                for _ in range(10)
            ]
            user.two_factor_enabled = True
            user.two_factor_backup_codes = backup_codes
            user.save(update_fields=["two_factor_enabled", "two_factor_backup_codes"])

            return Response({
                "detail": "Authentification à deux facteurs activée avec succès.",
                "backup_codes": backup_codes,
            })

        return Response(
            {"code": ["Code de vérification 2FA invalide ou expiré."]},
            status=status.HTTP_400_BAD_REQUEST,
        )


class Disable2FAView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        password = request.data.get("password", "")
        code = str(request.data.get("code", "")).strip()

        if not user.check_password(password):
            return Response(
                {"password": ["Mot de passe incorrect."]},
                status=status.HTTP_400_BAD_REQUEST,
            )

        is_valid = False
        if user.two_factor_secret:
            totp = pyotp.TOTP(user.two_factor_secret)
            if totp.verify(code, valid_window=1):
                is_valid = True

        if not is_valid and user.two_factor_backup_codes:
            code_upper = code.upper()
            if code_upper in user.two_factor_backup_codes:
                is_valid = True

        if is_valid or not user.two_factor_enabled:
            user.two_factor_enabled = False
            user.two_factor_secret = None
            user.two_factor_backup_codes = []
            user.save(update_fields=["two_factor_enabled", "two_factor_secret", "two_factor_backup_codes"])
            return Response({"detail": "Authentification à deux facteurs désactivée."})

        return Response(
            {"code": ["Code 2FA ou code de secours invalide."]},
            status=status.HTTP_400_BAD_REQUEST,
        )


class Verify2FALoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        temp_token = request.data.get("temp_token", "")
        code = str(request.data.get("code", "")).strip()
        backup_code = str(request.data.get("backup_code", "")).strip()

        signer = TimestampSigner()
        try:
            user_id = signer.unsign(temp_token, max_age=300)
        except (BadSignature, SignatureExpired):
            return Response(
                {"detail": "Session temporaire de connexion expirée ou invalide. Veuillez vous réauthentifier."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response({"detail": "Utilisateur introuvable."}, status=status.HTTP_404_NOT_FOUND)

        success = False

        if code and user.two_factor_secret:
            totp = pyotp.TOTP(user.two_factor_secret)
            if totp.verify(code, valid_window=1):
                success = True

        if not success and backup_code:
            clean_backup = backup_code.upper()
            if clean_backup in user.two_factor_backup_codes:
                success = True
                user.two_factor_backup_codes.remove(clean_backup)
                user.save(update_fields=["two_factor_backup_codes"])

        if success:
            refresh = RefreshToken.for_user(user)
            user.last_login = timezone.now()
            user.save(update_fields=["last_login"])
            return Response({
                "access": str(refresh.access_token),
                "refresh": str(refresh),
                "user": UserSerializer(user).data,
            })

        return Response(
            {"detail": "Code de vérification ou code de secours invalide."},
            status=status.HTTP_400_BAD_REQUEST,
        )



class EntrepriseViewSet(viewsets.ModelViewSet):
    queryset = Entreprise.objects.all()
    serializer_class = EntrepriseSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [
        DjangoFilterBackend,
        SearchFilter,
        OrderingFilter,
    ]
    filterset_fields = [
        "statut_validation",
        "actif",
        "secteur_activite",
    ]
    search_fields = [
        "nom",
        "matricule_fiscal",
        "email",
        "secteur_activite",
    ]
    ordering_fields = [
        "nom",
        "date_creation",
        "actif",
    ]
    ordering = ["nom"]

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user
        if user.is_authenticated and not getattr(user, "is_superuser", False):
            if getattr(user, "entreprise", None):
                return qs.filter(id=user.entreprise.id)
        return qs

    def perform_update(self, serializer):
        old_statut = serializer.instance.statut_validation
        instance = serializer.save()
        new_statut = instance.statut_validation
        if old_statut != new_statut:
            if new_statut == Entreprise.STATUT_APPROUVE:
                approve_entreprise(instance)
            elif new_statut == Entreprise.STATUT_REJETE:
                reject_entreprise(instance, motif_rejet=instance.motif_rejet or "")

    @action(detail=True, methods=["post"], url_path="approve")
    def approve(self, request, pk=None):
        entreprise = self.get_object()
        approve_entreprise(entreprise)
        return Response({"detail": f"L'entreprise '{entreprise.nom}' a été approuvée et le compte administrateur a été activé."})

    @action(detail=True, methods=["post"], url_path="reject")
    def reject(self, request, pk=None):
        entreprise = self.get_object()
        motif = request.data.get("motif_rejet", "")
        reject_entreprise(entreprise, motif_rejet=motif)
        return Response({"detail": f"L'entreprise '{entreprise.nom}' a été rejetée."})


class PermissionViewSet(viewsets.ModelViewSet):
    queryset = Permission.objects.all()
    serializer_class = PermissionSerializer
    permission_classes = [CanManageUsers]
    filter_backends = [DjangoFilterBackend, SearchFilter]
    filterset_fields = ["module"]
    search_fields = ["code", "nom", "module"]
    ordering = ["module", "code"]


class RoleViewSet(viewsets.ModelViewSet):
    queryset = Role.objects.select_related("entreprise").prefetch_related("permissions")
    serializer_class = RoleSerializer
    permission_classes = [CanManageUsers]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ["entreprise", "actif"]
    search_fields = ["nom", "description", "entreprise__nom"]
    ordering_fields = ["nom", "date_creation"]
    ordering = ["nom"]

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user
        if user.is_authenticated and not getattr(user, "is_superuser", False) and getattr(user, "entreprise", None):
            return qs.filter(entreprise=user.entreprise)
        return qs

    def perform_create(self, serializer):
        user = self.request.user
        if "entreprise" not in serializer.validated_data and getattr(user, "entreprise", None):
            serializer.save(entreprise=user.entreprise)
        else:
            serializer.save()


class RolePermissionViewSet(viewsets.ModelViewSet):
    queryset = RolePermission.objects.select_related("role", "permission")
    serializer_class = RolePermissionSerializer
    permission_classes = [CanManageUsers]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["role", "permission"]


class DepartementViewSet(viewsets.ModelViewSet):
    queryset = Departement.objects.select_related("entreprise", "responsable")
    serializer_class = DepartementSerializer
    permission_classes = [CanManageUsers]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ["entreprise", "actif", "responsable"]
    search_fields = ["nom", "entreprise__nom", "responsable__username"]
    ordering_fields = ["nom", "date_creation"]
    ordering = ["nom"]

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user
        if user.is_authenticated and not getattr(user, "is_superuser", False) and getattr(user, "entreprise", None):
            return qs.filter(entreprise=user.entreprise)
        return qs

    def perform_create(self, serializer):
        user = self.request.user
        if "entreprise" not in serializer.validated_data and getattr(user, "entreprise", None):
            serializer.save(entreprise=user.entreprise)
        else:
            serializer.save()


class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.select_related("entreprise", "role", "departement")
    serializer_class = UserSerializer
    permission_classes = [CanManageUsers]
    filter_backends = [
        DjangoFilterBackend,
        SearchFilter,
        OrderingFilter,
    ]
    filterset_fields = [
        "statut_compte",
        "est_admin_entreprise",
        "actif",
        "is_active",
        "is_staff",
        "entreprise",
        "role",
        "departement",
    ]
    search_fields = [
        "username",
        "email",
        "first_name",
        "last_name",
        "telephone",
    ]
    ordering_fields = [
        "username",
        "email",
        "date_creation",
    ]
    ordering = ["username"]

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user
        if user.is_authenticated and not getattr(user, "is_superuser", False) and getattr(user, "entreprise", None):
            return qs.filter(entreprise=user.entreprise)
        return qs

    def perform_create(self, serializer):
        user = self.request.user
        save_kwargs = {}
        if getattr(user, "entreprise", None) and not getattr(user, "is_superuser", False):
            save_kwargs["entreprise"] = user.entreprise

        # Direct employee creation by company admin (Step 4)
        save_kwargs["statut_compte"] = User.STATUT_ACTIF
        save_kwargs["is_active"] = True
        save_kwargs["actif"] = True
        save_kwargs["est_admin_entreprise"] = False

        serializer.save(**save_kwargs)

    def destroy(self, request, *args, **kwargs):
        user = self.get_object()
        if user.est_admin_entreprise and not request.user.is_superuser:
            return Response(
                {"detail": "Le compte administrateur principal de l'entreprise ne peut pas être supprimé ou désactivé."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        user.statut_compte = User.STATUT_INACTIF
        user.actif = False
        user.is_active = False
        user.save(update_fields=["statut_compte", "actif", "is_active"])
        return Response({"detail": "Utilisateur désactivé avec succès."})

    @action(detail=True, methods=["post"], url_path="activate")
    def activate(self, request, pk=None):
        user = self.get_object()
        user.statut_compte = User.STATUT_ACTIF
        user.actif = True
        user.is_active = True
        user.save(update_fields=["statut_compte", "actif", "is_active"])
        return Response({"detail": "Utilisateur activé avec succès."})

    @action(detail=True, methods=["post"], url_path="deactivate")
    def deactivate(self, request, pk=None):
        user = self.get_object()
        if user.est_admin_entreprise and not request.user.is_superuser:
            return Response(
                {"detail": "Le compte administrateur principal de l'entreprise ne peut pas être désactivé."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        user.statut_compte = User.STATUT_INACTIF
        user.actif = False
        user.is_active = False
        user.save(update_fields=["statut_compte", "actif", "is_active"])
        return Response({"detail": "Utilisateur désactivé avec succès."})