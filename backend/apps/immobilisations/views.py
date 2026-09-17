from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import status, permissions, viewsets
from rest_framework.decorators import action
from rest_framework.filters import OrderingFilter, SearchFilter
from rest_framework.response import Response

from .models import Emplacement, Famille, Immobilisation, MouvementEmplacement, PlanAmortissement, EcritureAmortissement
from .serializers import (
    EmplacementSerializer,
    FamilleSerializer,
    ImmobilisationSerializer,
    MouvementEmplacementSerializer,
    PlanAmortissementSerializer,
    EcritureAmortissementSerializer,
)


class FamilleViewSet(viewsets.ModelViewSet):
    queryset = Famille.objects.select_related("entreprise").all()
    serializer_class = FamilleSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ["entreprise"]
    search_fields = ["nom", "code", "description"]
    ordering_fields = ["nom", "code"]
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


class EmplacementViewSet(viewsets.ModelViewSet):
    queryset = Emplacement.objects.select_related("entreprise").all()
    serializer_class = EmplacementSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ["entreprise", "type"]
    search_fields = [
        "code_emplacement",
        "nom_emplacement",
        "adresse",
        "responsable",
        "description",
    ]
    ordering_fields = ["nom_emplacement", "code_emplacement", "type"]
    ordering = ["nom_emplacement"]

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


class ImmobilisationViewSet(viewsets.ModelViewSet):
    queryset = Immobilisation.objects.select_related(
        "entreprise", "famille", "emplacement_actuel"
    ).all()
    serializer_class = ImmobilisationSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = [
        "entreprise",
        "famille",
        "etat",
        "statut",
        "emplacement_actuel",
    ]
    search_fields = [
        "code_inventaire",
        "designation",
        "description",
        "fournisseur",
        "numero_serie",
    ]
    ordering_fields = [
        "code_inventaire",
        "designation",
        "valeur_acquisition",
        "date_acquisition",
        "date_mise_en_service",
        "created_at",
    ]
    ordering = ["-created_at"]

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

    @action(detail=True, methods=["post"])
    def transferer(self, request, pk=None):
        immobilisation = self.get_object()
        nouvel_emplacement_id = request.data.get("nouvel_emplacement")
        if not nouvel_emplacement_id:
            return Response({"nouvel_emplacement": ["Ce champ est requis."]}, status=status.HTTP_400_BAD_REQUEST)

        try:
            nouvel_emplacement = Emplacement.objects.get(pk=nouvel_emplacement_id)
        except Emplacement.DoesNotExist:
            return Response({"nouvel_emplacement": ["Emplacement introuvable."]}, status=status.HTTP_400_BAD_REQUEST)

        ancien_emplacement = immobilisation.emplacement_actuel

        mouvement = MouvementEmplacement.objects.create(
            immobilisation=immobilisation,
            ancien_emplacement=ancien_emplacement,
            nouvel_emplacement=nouvel_emplacement,
            responsable_transfert=request.user if request.user.is_authenticated else None,
            utilisateur_concerne_id=request.data.get("utilisateur_concerne") or None,
            motif=request.data.get("motif", ""),
            commentaire=request.data.get("commentaire", ""),
        )

        immobilisation.emplacement_actuel = nouvel_emplacement
        immobilisation.save(update_fields=["emplacement_actuel"])

        serializer = self.get_serializer(immobilisation)
        return Response(serializer.data)


class MouvementEmplacementViewSet(viewsets.ModelViewSet):
    queryset = MouvementEmplacement.objects.select_related(
        "immobilisation",
        "ancien_emplacement",
        "nouvel_emplacement",
        "responsable_transfert",
        "utilisateur_concerne",
    ).all()
    serializer_class = MouvementEmplacementSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = [
        "immobilisation",
        "ancien_emplacement",
        "nouvel_emplacement",
        "responsable_transfert",
        "utilisateur_concerne",
    ]
    search_fields = [
        "immobilisation__code_inventaire",
        "immobilisation__designation",
        "motif",
        "commentaire",
    ]
    ordering_fields = ["date_transfert", "id"]
    ordering = ["-date_transfert"]

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user
        if user.is_authenticated and not getattr(user, "is_superuser", False) and getattr(user, "entreprise", None):
            return qs.filter(immobilisation__entreprise=user.entreprise)
        return qs

    def perform_create(self, serializer):
        user = self.request.user
        extra_kwargs = {}
        if "responsable_transfert" not in serializer.validated_data and user.is_authenticated:
            extra_kwargs["responsable_transfert"] = user
        mouvement = serializer.save(**extra_kwargs)
        if mouvement.nouvel_emplacement:
            immobilisation = mouvement.immobilisation
            if not mouvement.ancien_emplacement and immobilisation.emplacement_actuel:
                mouvement.ancien_emplacement = immobilisation.emplacement_actuel
                mouvement.save(update_fields=["ancien_emplacement"])
            immobilisation.emplacement_actuel = mouvement.nouvel_emplacement
            immobilisation.save(update_fields=["emplacement_actuel"])


class PlanAmortissementViewSet(viewsets.ModelViewSet):
    queryset = PlanAmortissement.objects.select_related("immobilisation", "immobilisation__entreprise").prefetch_related("ecritures").all()
    serializer_class = PlanAmortissementSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ["immobilisation", "mode_amortissement"]
    search_fields = ["immobilisation__code_inventaire", "immobilisation__designation"]
    ordering_fields = ["created_at", "date_debut_amortissement", "valeur_acquisition"]
    ordering = ["-created_at"]

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user
        if user.is_authenticated and not getattr(user, "is_superuser", False) and getattr(user, "entreprise", None):
            return qs.filter(immobilisation__entreprise=user.entreprise)
        return qs

    def perform_create(self, serializer):
        plan = serializer.save()
        plan.calculate_schedule()

    def perform_update(self, serializer):
        plan = serializer.save()
        plan.calculate_schedule()

    @action(detail=True, methods=["post"])
    def recalculer(self, request, pk=None):
        plan = self.get_object()
        plan.calculate_schedule()
        serializer = self.get_serializer(plan)
        return Response(serializer.data)


class EcritureAmortissementViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = EcritureAmortissement.objects.select_related("plan", "plan__immobilisation").all()
    serializer_class = EcritureAmortissementSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ["plan", "exercice"]
    ordering_fields = ["exercice", "date_calcul"]
    ordering = ["exercice"]

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user
        if user.is_authenticated and not getattr(user, "is_superuser", False) and getattr(user, "entreprise", None):
            return qs.filter(plan__immobilisation__entreprise=user.entreprise)
        return qs
