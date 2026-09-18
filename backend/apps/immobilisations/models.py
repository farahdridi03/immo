from django.conf import settings
from django.db import models
from django.utils import timezone
from simple_history.models import HistoricalRecords  # type: ignore


class Famille(models.Model):
    nom = models.CharField(max_length=255)
    code = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    entreprise = models.ForeignKey(
        "users.Entreprise",
        on_delete=models.CASCADE,
        related_name="familles",
    )

    class Meta:
        db_table = "familles"
        unique_together = ("entreprise", "code")
        ordering = ["nom"]

    history = HistoricalRecords()

    def __str__(self):
        return f"{self.nom} ({self.code})"


class Emplacement(models.Model):
    TYPE_BUREAU = "bureau"
    TYPE_DEPOT = "depot"
    TYPE_CHANTIER = "chantier"
    TYPE_AGENCE = "agence"

    TYPE_CHOICES = [
        (TYPE_BUREAU, "Bureau"),
        (TYPE_DEPOT, "Dépôt"),
        (TYPE_CHANTIER, "Chantier"),
        (TYPE_AGENCE, "Agence"),
    ]

    code_emplacement = models.CharField(max_length=100)
    entreprise = models.ForeignKey(
        "users.Entreprise",
        on_delete=models.CASCADE,
        related_name="emplacements",
    )
    nom_emplacement = models.CharField(max_length=255)
    type = models.CharField(
        max_length=50,
        choices=TYPE_CHOICES,
        default=TYPE_BUREAU,
    )
    adresse = models.TextField(blank=True)
    responsable = models.CharField(max_length=255, blank=True)
    description = models.TextField(blank=True)

    class Meta:
        db_table = "emplacements"
        unique_together = ("entreprise", "code_emplacement")
        ordering = ["nom_emplacement"]

    history = HistoricalRecords()

    def __str__(self):
        return f"{self.nom_emplacement} ({self.code_emplacement})"


class Immobilisation(models.Model):
    ETAT_NEUF = "neuf"
    ETAT_BON = "bon"
    ETAT_MOYEN = "moyen"
    ETAT_MAUVAIS = "mauvais"
    ETAT_HORS_SERVICE = "hors_service"

    ETAT_CHOICES = [
        (ETAT_NEUF, "Neuf"),
        (ETAT_BON, "Bon"),
        (ETAT_MOYEN, "Moyen"),
        (ETAT_MAUVAIS, "Mauvais"),
        (ETAT_HORS_SERVICE, "Hors service"),
    ]

    STATUT_EN_SERVICE = "en_service"
    STATUT_EN_MAINTENANCE = "en_maintenance"
    STATUT_REFORME = "reforme"
    STATUT_CEDE = "cede"

    STATUT_CHOICES = [
        (STATUT_EN_SERVICE, "En service"),
        (STATUT_EN_MAINTENANCE, "En maintenance"),
        (STATUT_REFORME, "Réformé"),
        (STATUT_CEDE, "Cédé"),
    ]

    code_inventaire = models.CharField(max_length=100)
    entreprise = models.ForeignKey(
        "users.Entreprise",
        on_delete=models.CASCADE,
        related_name="immobilisations",
    )
    designation = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    famille = models.ForeignKey(
        Famille,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="immobilisations",
    )
    fournisseur = models.CharField(max_length=255, blank=True)
    numero_serie = models.CharField(max_length=100, blank=True)
    date_acquisition = models.DateField(null=True, blank=True)
    valeur_acquisition = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        null=True,
        blank=True,
    )
    etat = models.CharField(
        max_length=50,
        choices=ETAT_CHOICES,
        default=ETAT_NEUF,
    )
    statut = models.CharField(
        max_length=50,
        choices=STATUT_CHOICES,
        default=STATUT_EN_SERVICE,
    )
    emplacement_actuel = models.ForeignKey(
        Emplacement,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="immobilisations",
    )
    date_mise_en_service = models.DateField(null=True, blank=True)
    image = models.ImageField(
        upload_to="immobilisations/images/",
        blank=True,
        null=True,
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "immobilisations"
        unique_together = ("entreprise", "code_inventaire")
        ordering = ["-created_at"]

    history = HistoricalRecords()

    def __str__(self):
        return f"{self.designation} ({self.code_inventaire})"


class MouvementEmplacement(models.Model):
    immobilisation = models.ForeignKey(
        Immobilisation,
        on_delete=models.CASCADE,
        related_name="mouvements_emplacement",
    )
    ancien_emplacement = models.ForeignKey(
        Emplacement,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="mouvements_anciens",
    )
    nouvel_emplacement = models.ForeignKey(
        Emplacement,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="mouvements_nouveaux",
    )
    date_transfert = models.DateTimeField(default=timezone.now)
    responsable_transfert = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="mouvements_effectues",
    )
    utilisateur_concerne = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="mouvements_concernes",
    )
    motif = models.CharField(max_length=255, blank=True)
    commentaire = models.TextField(blank=True)

    class Meta:
        db_table = "mouvements_emplacement"
        ordering = ["-date_transfert"]

    def __str__(self):
        return f"Mouvement {self.id} - {self.immobilisation.code_inventaire}"


from decimal import Decimal

class PlanAmortissement(models.Model):
    MODE_LINEAIRE = "lineaire"
    MODE_DEGRESSIF = "degressif"

    MODE_CHOICES = [
        (MODE_LINEAIRE, "Linéaire"),
        (MODE_DEGRESSIF, "Dégressif"),
    ]

    immobilisation = models.OneToOneField(
        Immobilisation,
        on_delete=models.CASCADE,
        related_name="plan_amortissement",
    )
    valeur_acquisition = models.DecimalField(
        max_digits=15,
        decimal_places=2,
    )
    date_debut_amortissement = models.DateField()
    duree_amortissement = models.PositiveIntegerField(
        help_text="Durée en années",
    )
    taux_amortissement = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        help_text="Taux annuel en pourcentage (%)",
    )
    mode_amortissement = models.CharField(
        max_length=20,
        choices=MODE_CHOICES,
        default=MODE_LINEAIRE,
    )
    valeur_residuelle = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        default=Decimal("0.00"),
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "plans_amortissement"
        ordering = ["-created_at"]

    history = HistoricalRecords()

    def __str__(self):
        return f"Plan Amortissement - {self.immobilisation.code_inventaire}"

    def calculate_schedule(self):
        from decimal import Decimal
        import datetime

        self.ecritures.all().delete()

        val_acq = Decimal(str(self.valeur_acquisition)) if self.valeur_acquisition is not None else Decimal("0.00")
        val_res = Decimal(str(self.valeur_residuelle)) if self.valeur_residuelle is not None else Decimal("0.00")
        base_amortissable = val_acq - val_res

        if base_amortissable <= 0 or self.duree_amortissement <= 0:
            return

        mode = self.mode_amortissement
        duree = self.duree_amortissement
        start_date = self.date_debut_amortissement
        if isinstance(start_date, str):
            start_date = datetime.datetime.strptime(start_date, "%Y-%m-%d").date()
        start_year = start_date.year

        ecritures_to_create = []

        if mode == self.MODE_LINEAIRE:
            annual_rate = Decimal(100) / Decimal(duree)
            taux_applied = Decimal(str(self.taux_amortissement)) if self.taux_amortissement and Decimal(str(self.taux_amortissement)) > 0 else annual_rate

            start_month = start_date.month
            months_year1 = 12 - start_month + 1

            annual_depreciation = base_amortissable / Decimal(duree)

            cumul = Decimal("0.00")
            current_vnc = val_acq

            if months_year1 < 12:
                total_years = duree + 1
            else:
                total_years = duree

            for i in range(total_years):
                year = start_year + i
                if i == 0:
                    annuite = (annual_depreciation * Decimal(months_year1) / Decimal(12)).quantize(Decimal("0.01"))
                elif i == total_years - 1 and months_year1 < 12:
                    annuite = base_amortissable - cumul
                else:
                    annuite = annual_depreciation.quantize(Decimal("0.01"))

                if cumul + annuite > base_amortissable or i == total_years - 1:
                    annuite = base_amortissable - cumul

                cumul += annuite
                current_vnc = val_acq - cumul
                if current_vnc < val_res:
                    current_vnc = val_res

                calc_date = datetime.date(year, 12, 31)

                ecritures_to_create.append(
                    EcritureAmortissement(
                        plan=self,
                        exercice=year,
                        annuite=annuite,
                        amortissement_cumule=cumul,
                        valeur_nette_comptable=current_vnc,
                        date_calcul=calc_date,
                    )
                )

        elif mode == self.MODE_DEGRESSIF:
            if duree in (3, 4):
                coeff = Decimal("1.25")
            elif duree in (5, 6):
                coeff = Decimal("1.75")
            else:
                coeff = Decimal("2.25")

            taux_lin = Decimal(100) / Decimal(duree)
            taux_deg = (taux_lin * coeff).quantize(Decimal("0.01"))
            if self.taux_amortissement and Decimal(str(self.taux_amortissement)) > 0:
                taux_deg = Decimal(str(self.taux_amortissement))

            cumul = Decimal("0.00")
            current_vnc = val_acq
            vnc_beginning = val_acq

            for i in range(duree):
                year = start_year + i
                annees_restantes = duree - i
                taux_linear_remaining = (Decimal(100) / Decimal(annees_restantes)).quantize(Decimal("0.01"))

                if taux_deg >= taux_linear_remaining:
                    annuite = (vnc_beginning * (taux_deg / Decimal(100))).quantize(Decimal("0.01"))
                else:
                    annuite = (vnc_beginning / Decimal(annees_restantes)).quantize(Decimal("0.01"))

                if i == duree - 1 or cumul + annuite > base_amortissable:
                    annuite = base_amortissable - cumul

                cumul += annuite
                vnc_beginning -= annuite
                current_vnc = val_acq - cumul
                if current_vnc < val_res:
                    current_vnc = val_res

                calc_date = datetime.date(year, 12, 31)

                ecritures_to_create.append(
                    EcritureAmortissement(
                        plan=self,
                        exercice=year,
                        annuite=annuite,
                        amortissement_cumule=cumul,
                        valeur_nette_comptable=current_vnc,
                        date_calcul=calc_date,
                    )
                )

        EcritureAmortissement.objects.bulk_create(ecritures_to_create)


class EcritureAmortissement(models.Model):
    plan = models.ForeignKey(
        PlanAmortissement,
        on_delete=models.CASCADE,
        related_name="ecritures",
    )
    exercice = models.PositiveIntegerField()
    annuite = models.DecimalField(
        max_digits=15,
        decimal_places=2,
    )
    amortissement_cumule = models.DecimalField(
        max_digits=15,
        decimal_places=2,
    )
    valeur_nette_comptable = models.DecimalField(
        max_digits=15,
        decimal_places=2,
    )
    date_calcul = models.DateField(default=timezone.now)

    class Meta:
        db_table = "ecritures_amortissement"
        ordering = ["exercice"]

    def __str__(self):
        return f"Écriture {self.exercice} - {self.plan.immobilisation.code_inventaire} ({self.annuite})"
