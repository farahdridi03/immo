from decimal import Decimal
from django.conf import settings
from django.db import models
from django.utils import timezone


class ContratMaintenance(models.Model):
    TYPE_PREVENTIVE = "preventive"
    TYPE_CORRECTIVE = "corrective"

    TYPE_CHOICES = [
        (TYPE_PREVENTIVE, "Préventive"),
        (TYPE_CORRECTIVE, "Corrective"),
    ]

    PERIODICITE_MENSUELLE = "mensuelle"
    PERIODICITE_TRIMESTRIELLE = "trimestrielle"
    PERIODICITE_ANNUELLE = "annuelle"

    PERIODICITE_CHOICES = [
        (PERIODICITE_MENSUELLE, "Mensuelle"),
        (PERIODICITE_TRIMESTRIELLE, "Trimestrielle"),
        (PERIODICITE_ANNUELLE, "Annuelle"),
    ]

    STATUT_ACTIF = "actif"
    STATUT_EXPIRE = "expire"
    STATUT_RESILIE = "resilie"

    STATUT_CHOICES = [
        (STATUT_ACTIF, "Actif"),
        (STATUT_EXPIRE, "Expiré"),
        (STATUT_RESILIE, "Résilié"),
    ]

    reference = models.CharField(max_length=100)
    entreprise = models.ForeignKey(
        "users.Entreprise",
        on_delete=models.CASCADE,
        related_name="contrats_maintenance",
    )
    fournisseur = models.CharField(max_length=255)
    date_debut = models.DateField()
    date_fin = models.DateField()
    montant = models.DecimalField(max_digits=15, decimal_places=2, default=Decimal("0.00"))
    type_maintenance = models.CharField(
        max_length=50,
        choices=TYPE_CHOICES,
        default=TYPE_PREVENTIVE,
    )
    periodicite = models.CharField(
        max_length=50,
        choices=PERIODICITE_CHOICES,
        default=PERIODICITE_MENSUELLE,
    )
    statut = models.CharField(
        max_length=50,
        choices=STATUT_CHOICES,
        default=STATUT_ACTIF,
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "contrats_maintenance"
        unique_together = ("entreprise", "reference")
        ordering = ["-date_debut"]

    def __str__(self):
        return f"Contrat {self.reference} ({self.fournisseur})"

    def check_status(self):
        today = timezone.now().date()
        if self.statut == self.STATUT_ACTIF and self.date_fin and self.date_fin < today:
            self.statut = self.STATUT_EXPIRE
            self.save(update_fields=["statut"])


class ImmobilisationContrat(models.Model):
    contrat = models.ForeignKey(
        ContratMaintenance,
        on_delete=models.CASCADE,
        related_name="immobilisations_contrat",
    )
    immobilisation = models.ForeignKey(
        "immobilisations.Immobilisation",
        on_delete=models.CASCADE,
        related_name="contrats_immobilisation",
    )

    class Meta:
        db_table = "immobilisations_contrats"
        unique_together = ("contrat", "immobilisation")

    def __str__(self):
        return f"{self.contrat.reference} - {self.immobilisation.code_inventaire}"


class DocumentContrat(models.Model):
    contrat = models.ForeignKey(
        ContratMaintenance,
        on_delete=models.CASCADE,
        related_name="documents",
    )
    fichier = models.FileField(upload_to="contrats/documents/")
    nom = models.CharField(max_length=255)
    date_ajout = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "documents_contrats"
        ordering = ["-date_ajout"]

    def __str__(self):
        return f"{self.nom} ({self.contrat.reference})"


class Intervention(models.Model):
    STATUT_PLANIFIE = "planifie"
    STATUT_EN_COURS = "en_cours"
    STATUT_REALISE = "realise"
    STATUT_ANNULE = "annule"

    STATUT_CHOICES = [
        (STATUT_PLANIFIE, "Planifiée"),
        (STATUT_EN_COURS, "En cours"),
        (STATUT_REALISE, "Réalisée"),
        (STATUT_ANNULE, "Annulée"),
    ]

    contrat = models.ForeignKey(
        ContratMaintenance,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="interventions",
    )
    immobilisation = models.ForeignKey(
        "immobilisations.Immobilisation",
        on_delete=models.CASCADE,
        related_name="interventions",
    )
    date_intervention = models.DateField(default=timezone.now)
    type_intervention = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    technicien = models.CharField(max_length=255, blank=True)
    cout = models.DecimalField(max_digits=15, decimal_places=2, default=Decimal("0.00"))
    statut = models.CharField(
        max_length=50,
        choices=STATUT_CHOICES,
        default=STATUT_PLANIFIE,
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "interventions_maintenance"
        ordering = ["-date_intervention"]

    def __str__(self):
        return f"Intervention {self.id} - {self.immobilisation.code_inventaire} ({self.statut})"


class Alerte(models.Model):
    STATUT_NON_LU = "non_lu"
    STATUT_LU = "lu"

    STATUT_CHOICES = [
        (STATUT_NON_LU, "Non lu"),
        (STATUT_LU, "Lu"),
    ]

    TYPE_EXPIRATION_CONTRAT = "expiration_contrat"
    TYPE_MOUVEMENT = "mouvement"
    TYPE_AMORTISSEMENT = "amortissement"
    TYPE_MAINTENANCE = "maintenance"
    TYPE_AUTRE = "autre"
    TYPE_CHOICES = [
        (TYPE_EXPIRATION_CONTRAT, "Expiration de contrat"),
        (TYPE_MOUVEMENT, "Mouvement d'emplacement"),
        (TYPE_AMORTISSEMENT, "Amortissement"),
        (TYPE_MAINTENANCE, "Intervention de maintenance"),
        (TYPE_AUTRE, "Autre alerte"),
    ]

    contrat = models.ForeignKey(
        ContratMaintenance,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="alertes",
    )
    immobilisation = models.ForeignKey(
        "immobilisations.Immobilisation",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="alertes",
    )
    type_alerte = models.CharField(max_length=100, choices=TYPE_CHOICES, default=TYPE_EXPIRATION_CONTRAT)
    lien_cible = models.CharField(max_length=255, blank=True, null=True, help_text="Redirection interne (ex: /maintenance)")
    message = models.TextField()
    date_alerte = models.DateTimeField(default=timezone.now)
    destinataire = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="alertes",
    )
    statut_lecture = models.CharField(
        max_length=50,
        choices=STATUT_CHOICES,
        default=STATUT_NON_LU,
    )

    class Meta:
        db_table = "alertes_maintenance"
        ordering = ["-date_alerte"]

    def __str__(self):
        return f"Alerte {self.type_alerte} - {self.destinataire.username}"
