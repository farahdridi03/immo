from rest_framework import serializers
from apps.users.models import Entreprise
from .models import (
    ContratMaintenance,
    ImmobilisationContrat,
    DocumentContrat,
    Intervention,
    Alerte,
)


class DocumentContratSerializer(serializers.ModelSerializer):
    class Meta:
        model = DocumentContrat
        fields = ["id", "contrat", "fichier", "nom", "date_ajout"]
        read_only_fields = ["id", "date_ajout"]


class ImmobilisationContratSerializer(serializers.ModelSerializer):
    immobilisation_code = serializers.CharField(source="immobilisation.code_inventaire", read_only=True)
    immobilisation_designation = serializers.CharField(source="immobilisation.designation", read_only=True)

    class Meta:
        model = ImmobilisationContrat
        fields = [
            "id",
            "contrat",
            "immobilisation",
            "immobilisation_code",
            "immobilisation_designation",
        ]
        read_only_fields = ["id", "immobilisation_code", "immobilisation_designation"]


class ContratMaintenanceSerializer(serializers.ModelSerializer):
    entreprise = serializers.PrimaryKeyRelatedField(
        queryset=Entreprise.objects.all(),
        required=False,
        allow_null=True,
    )
    type_maintenance_display = serializers.CharField(source="get_type_maintenance_display", read_only=True)
    periodicite_display = serializers.CharField(source="get_periodicite_display", read_only=True)
    statut_display = serializers.CharField(source="get_statut_display", read_only=True)
    entreprise_nom = serializers.CharField(source="entreprise.nom", read_only=True)
    documents = DocumentContratSerializer(many=True, read_only=True)
    immobilisations_details = ImmobilisationContratSerializer(source="immobilisations_contrat", many=True, read_only=True)
    interventions_count = serializers.SerializerMethodField()

    class Meta:
        model = ContratMaintenance
        fields = [
            "id",
            "reference",
            "entreprise",
            "entreprise_nom",
            "fournisseur",
            "date_debut",
            "date_fin",
            "montant",
            "type_maintenance",
            "type_maintenance_display",
            "periodicite",
            "periodicite_display",
            "statut",
            "statut_display",
            "documents",
            "immobilisations_details",
            "interventions_count",
            "created_at",
            "updated_at",
        ]
        validators = []
        read_only_fields = [
            "id",
            "entreprise_nom",
            "type_maintenance_display",
            "periodicite_display",
            "statut_display",
            "documents",
            "immobilisations_details",
            "interventions_count",
            "created_at",
            "updated_at",
        ]

    def validate(self, attrs):
        request = self.context.get("request")
        if request and not attrs.get("entreprise"):
            user = request.user
            if getattr(user, "entreprise", None):
                attrs["entreprise"] = user.entreprise

        entreprise = attrs.get("entreprise")
        reference = attrs.get("reference")
        if entreprise and reference:
            qs = ContratMaintenance.objects.filter(entreprise=entreprise, reference=reference)
            if self.instance:
                qs = qs.exclude(pk=self.instance.pk)
            if qs.exists():
                raise serializers.ValidationError({"reference": "Un contrat avec cette référence existe déjà."})
        return attrs

    def get_interventions_count(self, obj):
        return obj.interventions.count()


class InterventionSerializer(serializers.ModelSerializer):
    statut_display = serializers.CharField(source="get_statut_display", read_only=True)
    immobilisation_code = serializers.CharField(source="immobilisation.code_inventaire", read_only=True)
    immobilisation_designation = serializers.CharField(source="immobilisation.designation", read_only=True)
    contrat_reference = serializers.CharField(source="contrat.reference", read_only=True, default=None)

    class Meta:
        model = Intervention
        fields = [
            "id",
            "contrat",
            "contrat_reference",
            "immobilisation",
            "immobilisation_code",
            "immobilisation_designation",
            "date_intervention",
            "type_intervention",
            "description",
            "technicien",
            "cout",
            "statut",
            "statut_display",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "statut_display",
            "immobilisation_code",
            "immobilisation_designation",
            "contrat_reference",
            "created_at",
            "updated_at",
        ]


class AlerteSerializer(serializers.ModelSerializer):
    statut_lecture_display = serializers.CharField(source="get_statut_lecture_display", read_only=True)
    type_alerte_display = serializers.CharField(source="get_type_alerte_display", read_only=True)
    contrat_reference = serializers.CharField(source="contrat.reference", read_only=True, default=None)
    immobilisation_code = serializers.CharField(source="immobilisation.code_inventaire", read_only=True, default=None)
    destinataire_username = serializers.CharField(source="destinataire.username", read_only=True)

    class Meta:
        model = Alerte
        fields = [
            "id",
            "contrat",
            "contrat_reference",
            "immobilisation",
            "immobilisation_code",
            "type_alerte",
            "type_alerte_display",
            "lien_cible",
            "message",
            "date_alerte",
            "destinataire",
            "destinataire_username",
            "statut_lecture",
            "statut_lecture_display",
        ]
        read_only_fields = [
            "id",
            "contrat_reference",
            "immobilisation_code",
            "destinataire_username",
            "statut_lecture_display",
            "type_alerte_display",
        ]

