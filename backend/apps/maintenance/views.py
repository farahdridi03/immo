from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.filters import OrderingFilter, SearchFilter
from rest_framework.response import Response

from .models import (
    ContratMaintenance,
    ImmobilisationContrat,
    DocumentContrat,
    Intervention,
    Alerte,
)
from .serializers import (
    ContratMaintenanceSerializer,
    ImmobilisationContratSerializer,
    DocumentContratSerializer,
    InterventionSerializer,
    AlerteSerializer,
)


class ContratMaintenanceViewSet(viewsets.ModelViewSet):
    queryset = ContratMaintenance.objects.select_related("entreprise").prefetch_related("documents", "immobilisations_contrat__immobilisation").all()
    serializer_class = ContratMaintenanceSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ["entreprise", "type_maintenance", "periodicite", "statut"]
    search_fields = ["reference", "fournisseur"]
    ordering_fields = ["date_debut", "date_fin", "montant", "created_at"]
    ordering = ["-date_debut"]

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user
        if user.is_authenticated and not getattr(user, "is_superuser", False) and getattr(user, "entreprise", None):
            qs = qs.filter(entreprise=user.entreprise)
        
        # Auto check expired contracts
        for contrat in qs:
            contrat.check_status()
        return qs

    def perform_create(self, serializer):
        user = self.request.user
        if "entreprise" not in serializer.validated_data and getattr(user, "entreprise", None):
            serializer.save(entreprise=user.entreprise)
        else:
            serializer.save()

    @action(detail=True, methods=["post"])
    def assign_immobilisations(self, request, pk=None):
        contrat = self.get_object()
        immobilisation_ids = request.data.get("immobilisations", [])
        if not isinstance(immobilisation_ids, list):
            return Response({"error": "immobilisations must be a list of IDs"}, status=status.HTTP_400_BAD_REQUEST)

        # Clear old and bulk create new
        ImmobilisationContrat.objects.filter(contrat=contrat).delete()
        new_relations = [
            ImmobilisationContrat(contrat=contrat, immobilisation_id=imm_id)
            for imm_id in immobilisation_ids
        ]
        ImmobilisationContrat.objects.bulk_create(new_relations)
        contrat = self.get_queryset().get(pk=contrat.pk)
        serializer = self.get_serializer(contrat)
        return Response(serializer.data)


class ImmobilisationContratViewSet(viewsets.ModelViewSet):
    queryset = ImmobilisationContrat.objects.select_related("contrat", "immobilisation").all()
    serializer_class = ImmobilisationContratSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["contrat", "immobilisation"]

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user
        if user.is_authenticated and not getattr(user, "is_superuser", False) and getattr(user, "entreprise", None):
            return qs.filter(contrat__entreprise=user.entreprise)
        return qs


class DocumentContratViewSet(viewsets.ModelViewSet):
    queryset = DocumentContrat.objects.select_related("contrat").all()
    serializer_class = DocumentContratSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["contrat"]

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user
        if user.is_authenticated and not getattr(user, "is_superuser", False) and getattr(user, "entreprise", None):
            return qs.filter(contrat__entreprise=user.entreprise)
        return qs


class InterventionViewSet(viewsets.ModelViewSet):
    queryset = Intervention.objects.select_related("contrat", "immobilisation").all()
    serializer_class = InterventionSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ["contrat", "immobilisation", "statut"]
    search_fields = ["type_intervention", "description", "technicien", "immobilisation__code_inventaire"]
    ordering_fields = ["date_intervention", "cout", "created_at"]
    ordering = ["-date_intervention"]

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user
        if user.is_authenticated and not getattr(user, "is_superuser", False) and getattr(user, "entreprise", None):
            return qs.filter(immobilisation__entreprise=user.entreprise)
        return qs


class AlerteViewSet(viewsets.ModelViewSet):
    queryset = Alerte.objects.select_related("contrat", "destinataire", "immobilisation").all()
    serializer_class = AlerteSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ["contrat", "statut_lecture", "destinataire", "type_alerte"]
    ordering_fields = ["date_alerte"]
    ordering = ["-date_alerte"]

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user
        if not user.is_authenticated:
            return qs.none()

        is_super = getattr(user, "is_superuser", False)
        is_admin = getattr(user, "est_admin_entreprise", False)
        role = getattr(user, "role", None)

        user_perms = set()
        if is_super or is_admin:
            user_perms = {"*"}
        elif role and hasattr(role, "permissions"):
            user_perms.update(role.permissions.values_list("code", flat=True))
            user_perms.update(role.permissions.values_list("module", flat=True))

        can_see_maintenance = "*" in user_perms or bool(user_perms.intersection({"P5", "maintenance", "view_maintenance", "gerer_maintenance"}))
        can_see_immo = "*" in user_perms or bool(user_perms.intersection({"P1", "P2", "P3", "familles", "immobilisations", "emplacements", "view_immobilisations", "view_emplacements"}))
        can_see_amort = "*" in user_perms or bool(user_perms.intersection({"P4", "amortissements", "view_amortissements"}))

        if can_see_maintenance:
            self._sync_contract_alerts(user)

        qs = qs.filter(destinataire=user)

        if "*" not in user_perms:
            disallowed_types = []
            if not can_see_maintenance:
                disallowed_types.extend([Alerte.TYPE_EXPIRATION_CONTRAT, Alerte.TYPE_MAINTENANCE])
            if not can_see_immo:
                disallowed_types.append(Alerte.TYPE_MOUVEMENT)
            if not can_see_amort:
                disallowed_types.append(Alerte.TYPE_AMORTISSEMENT)

            if disallowed_types:
                qs = qs.exclude(type_alerte__in=disallowed_types)

        return qs

    def _sync_contract_alerts(self, user):
        from datetime import timedelta
        from django.utils import timezone
        delai = getattr(getattr(user, "entreprise", None), "delai_alerte_expiration_jours", 15) or 15
        today = timezone.now().date()
        target_date = today + timedelta(days=delai)
        
        contrats = ContratMaintenance.objects.filter(
            statut=ContratMaintenance.STATUT_ACTIF,
            date_fin__gte=today,
            date_fin__lte=target_date,
        )
        if getattr(user, "entreprise", None):
            contrats = contrats.filter(entreprise=user.entreprise)
            
        for contrat in contrats:
            days_left = (contrat.date_fin - today).days
            message = f"Le contrat de maintenance {contrat.reference} ({contrat.fournisseur}) expire dans {days_left} jour(s) (le {contrat.date_fin.strftime('%d/%m/%Y')})."
            if not Alerte.objects.filter(destinataire=user, contrat=contrat, type_alerte=Alerte.TYPE_EXPIRATION_CONTRAT).exists():
                Alerte.objects.create(
                    contrat=contrat,
                    type_alerte=Alerte.TYPE_EXPIRATION_CONTRAT,
                    message=message,
                    destinataire=user,
                    statut_lecture=Alerte.STATUT_NON_LU,
                    lien_cible="/maintenance",
                )

    @action(detail=True, methods=["post"])
    def marquer_lu(self, request, pk=None):
        alerte = self.get_object()
        alerte.statut_lecture = Alerte.STATUT_LU
        alerte.save(update_fields=["statut_lecture"])
        serializer = self.get_serializer(alerte)
        return Response(serializer.data)

    @action(detail=False, methods=["post"])
    def marquer_tout_lu(self, request):
        user = request.user
        if user.is_authenticated:
            Alerte.objects.filter(destinataire=user, statut_lecture=Alerte.STATUT_NON_LU).update(statut_lecture=Alerte.STATUT_LU)
        return Response({"status": "success", "message": "Toutes les alertes ont été marquées comme lues."})

