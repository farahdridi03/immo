import os
from typing import Any
from rest_framework import serializers
from rest_framework.exceptions import AuthenticationFailed
from django.db import transaction
from django.core.mail import send_mail
from django.conf import settings
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import Departement, Entreprise, Permission, Role, RolePermission, User, UserPreference


import base64
from django.core.files.base import ContentFile


class Base64ImageField(serializers.ImageField):
    def to_internal_value(self, data: Any) -> Any:
        if data == "" or data is None:
            return None
        if isinstance(data, str):
            if data.startswith("data:image"):
                try:
                    format_str, imgstr = data.split(";base64,")
                    ext = format_str.split("/")[-1].split("+")[0]
                    data = ContentFile(base64.b64decode(imgstr), name=f"logo.{ext}")
                except Exception:
                    raise serializers.ValidationError("Format d'image invalide.")
            elif data.startswith("http") or data.startswith("/"):
                if self.parent and hasattr(self.parent, "instance") and self.parent.instance:
                    return self.parent.instance.logo
                return None
        return super().to_internal_value(data)


class EntrepriseSerializer(serializers.ModelSerializer):
    logo = Base64ImageField(required=False, allow_null=True)
    departements_count = serializers.SerializerMethodField()

    class Meta:
        model = Entreprise
        fields = [
            "id",
            "nom",
            "matricule_fiscal",
            "adresse",
            "telephone",
            "email",
            "logo",
            "secteur_activite",
            "statut_validation",
            "date_demande",
            "date_validation",
            "motif_rejet",
            "date_creation",
            "actif",
            "departements_count",
            "delai_alerte_expiration_jours",
            "destinataires_alertes",
        ]
        read_only_fields = [
            "id",
            "date_demande",
            "date_validation",
            "date_creation",
            "departements_count",
        ]

    def get_departements_count(self, obj):
        return obj.departements.count()


class PermissionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Permission
        fields = [
            "id",
            "code",
            "nom",
            "module",
        ]
        read_only_fields = ["id"]


class RolePermissionSerializer(serializers.ModelSerializer):
    permission_detail = PermissionSerializer(source="permission", read_only=True)

    class Meta:
        model = RolePermission
        fields = [
            "id",
            "role",
            "permission",
            "permission_detail",
        ]
        read_only_fields = ["id"]


class RoleSerializer(serializers.ModelSerializer):
    entreprise = serializers.PrimaryKeyRelatedField(
        queryset=Entreprise.objects.all(),
        required=False,
        allow_null=True,
    )
    entreprise_nom = serializers.CharField(source="entreprise.nom", read_only=True)
    permissions_details = PermissionSerializer(source="permissions", many=True, read_only=True)
    permissions = serializers.PrimaryKeyRelatedField(
        queryset=Permission.objects.all(),
        many=True,
        required=False,
    )
    utilisateurs_count = serializers.SerializerMethodField()

    class Meta:
        model = Role
        fields = [
            "id",
            "nom",
            "description",
            "entreprise",
            "entreprise_nom",
            "permissions",
            "permissions_details",
            "utilisateurs_count",
            "date_creation",
            "actif",
        ]
        read_only_fields = ["id", "date_creation"]
        validators = []

    def validate(self, attrs):
        request = self.context.get("request")
        entreprise = attrs.get("entreprise")
        if not entreprise and request and hasattr(request, "user"):
            entreprise = getattr(request.user, "entreprise", None)
            if entreprise:
                attrs["entreprise"] = entreprise
        return attrs

    def get_utilisateurs_count(self, obj):
        return obj.utilisateurs.count()

    def create(self, validated_data):
        permissions = validated_data.pop("permissions", None)
        role = Role.objects.create(**validated_data)
        if permissions is not None:
            RolePermission.objects.bulk_create(
                [RolePermission(role=role, permission=perm) for perm in permissions]
            )
        return role

    def update(self, instance, validated_data):
        permissions = validated_data.pop("permissions", None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if permissions is not None:
            instance.role_permissions.all().delete()
            RolePermission.objects.bulk_create(
                [RolePermission(role=instance, permission=perm) for perm in permissions]
            )
        return instance


class DepartementSerializer(serializers.ModelSerializer):
    entreprise_nom = serializers.CharField(source="entreprise.nom", read_only=True)
    responsable_nom = serializers.SerializerMethodField()

    class Meta:
        model = Departement
        fields = [
            "id",
            "nom",
            "entreprise",
            "entreprise_nom",
            "responsable",
            "responsable_nom",
            "date_creation",
            "actif",
        ]
        read_only_fields = ["id", "date_creation"]

    def get_responsable_nom(self, obj):
        if obj.responsable:
            full_name = f"{obj.responsable.first_name} {obj.responsable.last_name}".strip()
            return full_name or obj.responsable.username
        return None


class UserPreferenceSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserPreference
        fields = [
            "id",
            "notif_email_contrats",
            "notif_email_mouvements",
            "notif_email_amortissements",
            "notif_email_interventions",
            "notif_inapp_enabled",
            "langue",
            "theme",
            "devise",
            "items_par_page",
        ]
        read_only_fields = ["id"]


class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=False)
    avatar = Base64ImageField(required=False, allow_null=True)
    entreprise_nom = serializers.CharField(source="entreprise.nom", read_only=True)
    role_nom = serializers.CharField(source="role.nom", read_only=True)
    departement_nom = serializers.CharField(source="departement.nom", read_only=True)
    permissions = serializers.SerializerMethodField()
    preferences = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "email",
            "password",
            "first_name",
            "last_name",
            "entreprise",
            "entreprise_nom",
            "role",
            "role_nom",
            "departement",
            "departement_nom",
            "telephone",
            "avatar",
            "two_factor_enabled",
            "statut_compte",
            "est_admin_entreprise",
            "actif",
            "is_active",
            "is_staff",
            "is_superuser",
            "permissions",
            "preferences",
            "last_login",
            "date_creation",
        ]
        read_only_fields = [
            "id",
            "date_creation",
            "last_login",
            "entreprise_nom",
            "role_nom",
            "departement_nom",
            "permissions",
            "preferences",
            "two_factor_enabled",
        ]

    def get_preferences(self, obj):
        prefs, _ = UserPreference.objects.get_or_create(user=obj)
        return UserPreferenceSerializer(prefs).data

    def get_permissions(self, obj):
        if obj.is_superuser or obj.est_admin_entreprise:
            all_codes = list(Permission.objects.values_list("code", flat=True))
            all_modules = list(Permission.objects.values_list("module", flat=True))
            return list(set(all_codes + all_modules))
        if obj.role:
            codes = list(obj.role.permissions.values_list("code", flat=True))
            modules = list(obj.role.permissions.values_list("module", flat=True))
            return list(set(codes + modules))
        return []

    def create(self, validated_data):
        raw_password = validated_data.pop("password", None)
        user = User(**validated_data)
        if raw_password:
            user.set_password(raw_password)
        user.save()

        if user.email:
            app_url = os.getenv("FRONTEND_URL", "http://localhost:3000/login")
            entreprise_name = user.entreprise.nom if user.entreprise else "GestImmo"
            subject = f"Vos identifiants d'accès - {entreprise_name}"
            password_display = raw_password or "(défini par l'administrateur)"
            message = (
                f"Bonjour {user.first_name or user.username},\n\n"
                f"Un compte utilisateur vous a été créé sur la plateforme GestImmo pour l'entreprise '{entreprise_name}'.\n\n"
                f"Voici vos identifiants de connexion :\n"
                f"• Lien de l'application : {app_url}\n"
                f"• Nom d'utilisateur : {user.username}\n"
                f"• Mot de passe : {password_display}\n\n"
                f"Cordialement,\n"
                f"L'équipe GestImmo"
            )
            try:
                send_mail(
                    subject=subject,
                    message=message,
                    from_email=getattr(settings, "DEFAULT_FROM_EMAIL", "noreply@gestimmo.tn"),
                    recipient_list=[user.email],
                    fail_silently=True,
                )
            except Exception:
                pass

        return user

    def update(self, instance, validated_data):
        password = validated_data.pop("password", None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        if password:
            instance.set_password(password)
        instance.save()
        return instance


class UserProfileUpdateSerializer(serializers.ModelSerializer):
    avatar = Base64ImageField(required=False, allow_null=True)

    class Meta:
        model = User
        fields = [
            "first_name",
            "last_name",
            "email",
            "telephone",
            "avatar",
        ]


class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True, min_length=6)
    confirm_password = serializers.CharField(required=True)

    def validate(self, attrs):
        if attrs["new_password"] != attrs["confirm_password"]:
            raise serializers.ValidationError(
                {"confirm_password": "Le nouveau mot de passe et sa confirmation ne correspondent pas."}
            )
        return attrs



class RegisterSerializer(serializers.Serializer):
    # Infos Utilisateur Admin
    username = serializers.CharField(max_length=150)
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, min_length=6)
    first_name = serializers.CharField(max_length=150, required=False, allow_blank=True)
    last_name = serializers.CharField(max_length=150, required=False, allow_blank=True)
    user_telephone = serializers.CharField(max_length=30, required=False, allow_blank=True)

    # Infos Entreprise
    entreprise_nom = serializers.CharField(max_length=255)
    matricule_fiscal = serializers.CharField(max_length=100, required=False, allow_blank=True)
    adresse = serializers.CharField(required=False, allow_blank=True)
    entreprise_telephone = serializers.CharField(max_length=30, required=False, allow_blank=True)
    entreprise_email = serializers.EmailField(required=False, allow_blank=True)
    secteur_activite = serializers.CharField(max_length=255, required=False, allow_blank=True)

    def validate_username(self, value):
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("Ce nom d'utilisateur est déjà pris.")
        return value

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("Cet e-mail est déjà utilisé.")
        return value

    def create(self, validated_data):
        with transaction.atomic():
            entreprise = Entreprise.objects.create(
                nom=validated_data["entreprise_nom"],
                matricule_fiscal=validated_data.get("matricule_fiscal") or None,
                adresse=validated_data.get("adresse", ""),
                telephone=validated_data.get("entreprise_telephone", ""),
                email=validated_data.get("entreprise_email", ""),
                secteur_activite=validated_data.get("secteur_activite", ""),
                statut_validation=Entreprise.STATUT_EN_ATTENTE,
                actif=False,
            )

            user = User.objects.create(
                username=validated_data["username"],
                email=validated_data["email"],
                first_name=validated_data.get("first_name", ""),
                last_name=validated_data.get("last_name", ""),
                telephone=validated_data.get("user_telephone", ""),
                entreprise=entreprise,
                est_admin_entreprise=True,
                statut_compte=User.STATUT_EN_ATTENTE,
                is_active=False,
                actif=False,
            )
            user.set_password(validated_data["password"])
            user.save()

            if user.email:
                try:
                    send_mail(
                        subject="Demande d'inscription reçue - GestImmo",
                        message=(
                            f"Bonjour {user.first_name or user.username},\n\n"
                            f"Votre demande d'inscription pour l'entreprise '{entreprise.nom}' a bien été transmise avec succès.\n"
                            f"Votre compte est actuellement en attente de validation par l'administrateur de la plateforme.\n"
                            f"Vous recevrez un e-mail de confirmation dès que votre compte aura été validé.\n\n"
                            f"Cordialement,\n"
                            f"L'équipe GestImmo"
                        ),
                        from_email=getattr(settings, "DEFAULT_FROM_EMAIL", "noreply@gestimmo.tn"),
                        recipient_list=[user.email],
                        fail_silently=True,
                    )
                except Exception:
                    pass

            return user


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs: dict[str, Any]) -> dict[str, Any]:
        try:
            data = super().validate(attrs)
        except AuthenticationFailed as exc:
            # If user exists but is not active, provide clear status detail if possible
            username = attrs.get(self.username_field)
            user_qs = User.objects.filter(**{self.username_field: username})
            if user_qs.exists():
                user = user_qs.first()
                if isinstance(user, User):
                    entreprise = user.entreprise
                    if entreprise and entreprise.statut_validation == Entreprise.STATUT_EN_ATTENTE:
                        raise AuthenticationFailed(
                            "Votre entreprise est en attente de validation par l'administrateur de la plateforme."
                        )
                    if entreprise and entreprise.statut_validation == Entreprise.STATUT_REJETE:
                        motif = entreprise.motif_rejet or "Non spécifié"
                        raise AuthenticationFailed(
                            f"Votre demande d'inscription a été rejetée. Motif : {motif}"
                        )
                    if user.statut_compte == User.STATUT_EN_ATTENTE:
                        raise AuthenticationFailed(
                            "Votre compte est en attente de validation."
                        )
            raise exc

        user = self.user
        if isinstance(user, User):
            if not getattr(user, "is_superuser", False):
                entreprise = user.entreprise
                if entreprise and entreprise.statut_validation == Entreprise.STATUT_EN_ATTENTE:
                    raise AuthenticationFailed(
                        "Votre entreprise est en attente de validation par l'administrateur de la plateforme."
                    )

                if entreprise and entreprise.statut_validation == Entreprise.STATUT_REJETE:
                    motif = entreprise.motif_rejet or "Non spécifié"
                    raise AuthenticationFailed(
                        f"Votre demande d'inscription a été rejetée. Motif : {motif}"
                    )

                if user.statut_compte != User.STATUT_ACTIF or not user.is_active:
                    raise AuthenticationFailed(
                        "Votre compte utilisateur n'est pas actif."
                    )

            if user.two_factor_enabled:
                from django.core.signing import TimestampSigner
                signer = TimestampSigner()
                temp_token = signer.sign(str(user.id))
                return {
                    "requires_2fa": True,
                    "temp_token": temp_token,
                }

            res_data: dict[str, Any] = dict(data)
            res_data["user"] = UserSerializer(user).data
            return res_data
        return data