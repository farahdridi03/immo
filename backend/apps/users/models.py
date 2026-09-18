from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils import timezone
from simple_history.models import HistoricalRecords  # type: ignore


class Entreprise(models.Model):
    nom = models.CharField(max_length=255)

    matricule_fiscal = models.CharField(
        max_length=100,
        unique=True,
        blank=True,
        null=True,
    )

    adresse = models.TextField(
        blank=True,
    )

    telephone = models.CharField(
        max_length=30,
        blank=True,
    )

    email = models.EmailField(
        blank=True,
    )

    logo = models.ImageField(
        upload_to="entreprises/logos/",
        blank=True,
        null=True,
    )

    secteur_activite = models.CharField(
        max_length=255,
        blank=True,
    )

    STATUT_EN_ATTENTE = "en_attente"
    STATUT_APPROUVE = "approuve"
    STATUT_REJETE = "rejete"
    STATUT_VALIDATION_CHOICES = [
        (STATUT_EN_ATTENTE, "En attente"),
        (STATUT_APPROUVE, "Approuvé"),
        (STATUT_REJETE, "Rejeté"),
    ]

    statut_validation = models.CharField(
        max_length=20,
        choices=STATUT_VALIDATION_CHOICES,
        default=STATUT_EN_ATTENTE,
    )

    date_demande = models.DateTimeField(
        default=timezone.now,
    )

    date_validation = models.DateTimeField(
        null=True,
        blank=True,
    )

    motif_rejet = models.TextField(
        blank=True,
        null=True,
    )

    date_creation = models.DateTimeField(
        auto_now_add=True,
    )

    actif = models.BooleanField(
        default=False,
    )

    DESTINATAIRES_ADMIN_UNIQUEMENT = "admin_uniquement"
    DESTINATAIRES_RESPONSABLES_ET_ADMIN = "responsables_et_admin"
    DESTINATAIRES_TOUS = "tous"
    DESTINATAIRES_CHOICES = [
        (DESTINATAIRES_ADMIN_UNIQUEMENT, "Administrateurs uniquement"),
        (DESTINATAIRES_RESPONSABLES_ET_ADMIN, "Responsables et administrateurs"),
        (DESTINATAIRES_TOUS, "Tous les utilisateurs"),
    ]

    delai_alerte_expiration_jours = models.IntegerField(
        default=15,
        help_text="Délai d'alerte en jours avant l'expiration d'un contrat",
    )

    destinataires_alertes = models.CharField(
        max_length=50,
        choices=DESTINATAIRES_CHOICES,
        default=DESTINATAIRES_RESPONSABLES_ET_ADMIN,
    )

    class Meta:
        db_table = "entreprises"
        ordering = ["nom"]
        permissions = [
            ("manage_users", "Peut gérer les utilisateurs"),
            ("manage_roles", "Peut gérer les rôles"),
            ("manage_entreprises", "Peut gérer les entreprises"),
        ]

    def __str__(self):
        return self.nom

class Permission(models.Model):
    code = models.CharField(max_length=100, unique=True)
    nom = models.CharField(max_length=255)
    module = models.CharField(max_length=100)

    class Meta:
        db_table = "permissions"
        ordering = ["module", "code"]

    def __str__(self):
        return f"{self.nom} ({self.code})"


class Role(models.Model):
    nom = models.CharField(max_length=150)
    description = models.TextField(blank=True)
    entreprise = models.ForeignKey(
        Entreprise,
        on_delete=models.CASCADE,
        related_name="roles",
    )
    permissions = models.ManyToManyField(
        Permission,
        through="RolePermission",
        related_name="roles",
        blank=True,
    )
    date_creation = models.DateTimeField(auto_now_add=True)
    actif = models.BooleanField(default=True)

    class Meta:
        db_table = "roles"
        unique_together = ("entreprise", "nom")
        ordering = ["nom"]

    history = HistoricalRecords()

    def __str__(self):
        return f"{self.nom} - {self.entreprise.nom}"


class RolePermission(models.Model):
    role = models.ForeignKey(
        Role,
        on_delete=models.CASCADE,
        related_name="role_permissions",
    )
    permission = models.ForeignKey(
        Permission,
        on_delete=models.CASCADE,
        related_name="role_permissions",
    )

    class Meta:
        db_table = "role_permissions"
        unique_together = ("role", "permission")

    def __str__(self):
        return f"{self.role.nom} -> {self.permission.code}"


class Departement(models.Model):
    nom = models.CharField(max_length=255)
    entreprise = models.ForeignKey(
        Entreprise,
        on_delete=models.CASCADE,
        related_name="departements",
    )
    responsable = models.ForeignKey(
        "User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="departements_geres",
    )
    date_creation = models.DateTimeField(auto_now_add=True)
    actif = models.BooleanField(default=True)

    class Meta:
        db_table = "departements"
        ordering = ["nom"]

    def __str__(self):
        return f"{self.nom} ({self.entreprise.nom})"


class User(AbstractUser):
    entreprise = models.ForeignKey(
        Entreprise,
        on_delete=models.SET_NULL,
        related_name="utilisateurs",
        null=True,
        blank=True,
    )

    role = models.ForeignKey(
        Role,
        on_delete=models.SET_NULL,
        related_name="utilisateurs",
        null=True,
        blank=True,
    )

    departement = models.ForeignKey(
        Departement,
        on_delete=models.SET_NULL,
        related_name="utilisateurs",
        null=True,
        blank=True,
    )

    STATUT_EN_ATTENTE = "en_attente_validation"
    STATUT_ACTIF = "actif"
    STATUT_INACTIF = "inactif"
    STATUT_SUSPENDU = "suspendu"
    STATUT_COMPTE_CHOICES = [
        (STATUT_EN_ATTENTE, "En attente de validation"),
        (STATUT_ACTIF, "Actif"),
        (STATUT_INACTIF, "Inactif"),
        (STATUT_SUSPENDU, "Suspendu"),
    ]

    statut_compte = models.CharField(
        max_length=30,
        choices=STATUT_COMPTE_CHOICES,
        default=STATUT_EN_ATTENTE,
    )

    est_admin_entreprise = models.BooleanField(
        default=False,
    )

    telephone = models.CharField(
        max_length=30,
        blank=True,
    )

    avatar = models.ImageField(
        upload_to="users/avatars/",
        blank=True,
        null=True,
    )

    two_factor_enabled = models.BooleanField(
        default=False,
    )

    two_factor_secret = models.CharField(
        max_length=255,
        blank=True,
        null=True,
    )

    two_factor_backup_codes = models.JSONField(
        default=list,
        blank=True,
    )

    actif = models.BooleanField(
        default=False,
    )

    date_creation = models.DateTimeField(
        auto_now_add=True,
    )

    class Meta:
        db_table = "users"
        permissions = [
            (
                "manage_users",
                "Peut gérer les utilisateurs",
            ),
        ]

    history = HistoricalRecords()

    def __str__(self):
        return self.username


class UserPreference(models.Model):
    LANGUE_FRANCAIS = "fr"
    LANGUE_ARABE = "ar"
    LANGUE_CHOICES = [
        (LANGUE_FRANCAIS, "Français"),
        (LANGUE_ARABE, "العربية"),
    ]

    THEME_CLAIR = "clair"
    THEME_SOMBRE = "sombre"
    THEME_CHOICES = [
        (THEME_CLAIR, "Clair"),
        (THEME_SOMBRE, "Sombre"),
    ]

    DEVISE_TND = "TND"
    DEVISE_EUR = "EUR"
    DEVISE_USD = "USD"
    DEVISE_CHOICES = [
        (DEVISE_TND, "TND (DT)"),
        (DEVISE_EUR, "EUR (€)"),
        (DEVISE_USD, "USD ($)"),
    ]

    PAGINATION_CHOICES = [
        (10, "10 par page"),
        (25, "25 par page"),
        (50, "50 par page"),
    ]

    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name="preferences",
    )

    # Notifications
    notif_email_contrats = models.BooleanField(default=True)
    notif_email_mouvements = models.BooleanField(default=True)
    notif_email_amortissements = models.BooleanField(default=True)
    notif_email_interventions = models.BooleanField(default=True)
    notif_inapp_enabled = models.BooleanField(default=True)

    # Affichage
    langue = models.CharField(max_length=10, choices=LANGUE_CHOICES, default=LANGUE_FRANCAIS)
    theme = models.CharField(max_length=20, choices=THEME_CHOICES, default=THEME_CLAIR)
    devise = models.CharField(max_length=10, choices=DEVISE_CHOICES, default=DEVISE_TND)
    items_par_page = models.IntegerField(choices=PAGINATION_CHOICES, default=10)

    class Meta:
        db_table = "user_preferences"

    def __str__(self):
        return f"Préférences de {self.user.username}"
