import base64
import io
import qrcode
from rest_framework import serializers
from .models import Emplacement, Famille, Immobilisation, MouvementEmplacement
from apps.users.models import Entreprise


class FamilleSerializer(serializers.ModelSerializer):
    entreprise = serializers.PrimaryKeyRelatedField(
        queryset=Entreprise.objects.all(),
        required=False,
        allow_null=True,
    )
    entreprise_nom = serializers.CharField(source="entreprise.nom", read_only=True)

    class Meta:
        model = Famille
        fields = [
            "id",
            "nom",
            "code",
            "description",
            "entreprise",
            "entreprise_nom",
        ]
        read_only_fields = ["id", "entreprise_nom"]
        validators = []

    def validate(self, attrs):
        request = self.context.get("request")
        entreprise = attrs.get("entreprise")
        if not entreprise and request and hasattr(request, "user"):
            entreprise = getattr(request.user, "entreprise", None)
            if entreprise:
                attrs["entreprise"] = entreprise

        code = attrs.get("code")
        if entreprise and code:
            qs = Famille.objects.filter(entreprise=entreprise, code=code)
            if self.instance:
                qs = qs.exclude(pk=self.instance.pk)
            if qs.exists():
                raise serializers.ValidationError({"code": "Une famille avec ce code existe déjà."})
        return attrs


class EmplacementSerializer(serializers.ModelSerializer):
    entreprise = serializers.PrimaryKeyRelatedField(
        queryset=Entreprise.objects.all(),
        required=False,
        allow_null=True,
    )
    entreprise_nom = serializers.CharField(source="entreprise.nom", read_only=True)
    type_display = serializers.CharField(source="get_type_display", read_only=True)

    class Meta:
        model = Emplacement
        fields = [
            "id",
            "code_emplacement",
            "entreprise",
            "entreprise_nom",
            "nom_emplacement",
            "type",
            "type_display",
            "adresse",
            "responsable",
            "description",
        ]
        read_only_fields = ["id", "entreprise_nom", "type_display"]
        validators = []

    def validate(self, attrs):
        request = self.context.get("request")
        entreprise = attrs.get("entreprise")
        if not entreprise and request and hasattr(request, "user"):
            entreprise = getattr(request.user, "entreprise", None)
            if entreprise:
                attrs["entreprise"] = entreprise

        code = attrs.get("code_emplacement")
        if entreprise and code:
            qs = Emplacement.objects.filter(entreprise=entreprise, code_emplacement=code)
            if self.instance:
                qs = qs.exclude(pk=self.instance.pk)
            if qs.exists():
                raise serializers.ValidationError({"code_emplacement": "Un emplacement avec ce code existe déjà."})
        return attrs


from apps.users.serializers import Base64ImageField


class ImmobilisationSerializer(serializers.ModelSerializer):
    entreprise = serializers.PrimaryKeyRelatedField(
        queryset=Entreprise.objects.all(),
        required=False,
        allow_null=True,
    )
    image = Base64ImageField(required=False, allow_null=True)
    entreprise_nom = serializers.CharField(source="entreprise.nom", read_only=True)
    famille_nom = serializers.CharField(source="famille.nom", read_only=True)
    emplacement_actuel_nom = serializers.CharField(
        source="emplacement_actuel.nom_emplacement", read_only=True
    )
    etat_display = serializers.CharField(source="get_etat_display", read_only=True)
    statut_display = serializers.CharField(source="get_statut_display", read_only=True)
    qr_code_base64 = serializers.SerializerMethodField()

    def get_qr_code_base64(self, obj):
        try:
            qr_data = f"http://localhost:3000/immobilisations/{obj.id}?code={obj.code_inventaire}"
            qr = qrcode.QRCode(version=1, box_size=8, border=2)
            qr.add_data(qr_data)
            qr.make(fit=True)
            img = qr.make_image(fill_color="black", back_color="white")
            buffer = io.BytesIO()
            img.save(buffer)
            return "data:image/png;base64," + base64.b64encode(buffer.getvalue()).decode("utf-8")
        except Exception:
            return ""

    class Meta:
        model = Immobilisation
        fields = [
            "id",
            "code_inventaire",
            "entreprise",
            "entreprise_nom",
            "designation",
            "description",
            "famille",
            "famille_nom",
            "fournisseur",
            "numero_serie",
            "date_acquisition",
            "valeur_acquisition",
            "etat",
            "etat_display",
            "statut",
            "statut_display",
            "emplacement_actuel",
            "emplacement_actuel_nom",
            "date_mise_en_service",
            "image",
            "qr_code_base64",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "entreprise_nom",
            "famille_nom",
            "emplacement_actuel_nom",
            "etat_display",
            "statut_display",
            "created_at",
            "updated_at",
        ]
        validators = []

    def validate(self, attrs):
        request = self.context.get("request")
        entreprise = attrs.get("entreprise")
        if not entreprise and request and hasattr(request, "user"):
            entreprise = getattr(request.user, "entreprise", None)
            if entreprise:
                attrs["entreprise"] = entreprise

        code = attrs.get("code_inventaire")
        if entreprise and code:
            qs = Immobilisation.objects.filter(entreprise=entreprise, code_inventaire=code)
            if self.instance:
                qs = qs.exclude(pk=self.instance.pk)
            if qs.exists():
                raise serializers.ValidationError({"code_inventaire": "Une immobilisation avec ce code d'inventaire existe déjà."})
        return attrs


class MouvementEmplacementSerializer(serializers.ModelSerializer):
    immobilisation_code = serializers.CharField(
        source="immobilisation.code_inventaire", read_only=True
    )
    immobilisation_designation = serializers.CharField(
        source="immobilisation.designation", read_only=True
    )
    ancien_emplacement_nom = serializers.CharField(
        source="ancien_emplacement.nom_emplacement", read_only=True
    )
    nouvel_emplacement_nom = serializers.CharField(
        source="nouvel_emplacement.nom_emplacement", read_only=True
    )
    responsable_transfert_nom = serializers.SerializerMethodField()
    utilisateur_concerne_nom = serializers.SerializerMethodField()

    class Meta:
        model = MouvementEmplacement
        fields = [
            "id",
            "immobilisation",
            "immobilisation_code",
            "immobilisation_designation",
            "ancien_emplacement",
            "ancien_emplacement_nom",
            "nouvel_emplacement",
            "nouvel_emplacement_nom",
            "date_transfert",
            "responsable_transfert",
            "responsable_transfert_nom",
            "utilisateur_concerne",
            "utilisateur_concerne_nom",
            "motif",
            "commentaire",
        ]
        read_only_fields = [
            "id",
            "immobilisation_code",
            "immobilisation_designation",
            "ancien_emplacement_nom",
            "nouvel_emplacement_nom",
            "responsable_transfert_nom",
            "utilisateur_concerne_nom",
        ]

    def get_responsable_transfert_nom(self, obj):
        if obj.responsable_transfert:
            full_name = f"{obj.responsable_transfert.first_name} {obj.responsable_transfert.last_name}".strip()
            return full_name or obj.responsable_transfert.username
        return None

    def get_utilisateur_concerne_nom(self, obj):
        if obj.utilisateur_concerne:
            full_name = f"{obj.utilisateur_concerne.first_name} {obj.utilisateur_concerne.last_name}".strip()
            return full_name or obj.utilisateur_concerne.username
        return None


from .models import PlanAmortissement, EcritureAmortissement

class EcritureAmortissementSerializer(serializers.ModelSerializer):
    class Meta:
        model = EcritureAmortissement
        fields = [
            "id",
            "plan",
            "exercice",
            "annuite",
            "amortissement_cumule",
            "valeur_nette_comptable",
            "date_calcul",
        ]
        read_only_fields = ["id"]


class PlanAmortissementSerializer(serializers.ModelSerializer):
    ecritures = EcritureAmortissementSerializer(many=True, read_only=True)
    immobilisation_code = serializers.CharField(source="immobilisation.code_inventaire", read_only=True)
    immobilisation_designation = serializers.CharField(source="immobilisation.designation", read_only=True)
    mode_amortissement_display = serializers.CharField(source="get_mode_amortissement_display", read_only=True)

    class Meta:
        model = PlanAmortissement
        fields = [
            "id",
            "immobilisation",
            "immobilisation_code",
            "immobilisation_designation",
            "valeur_acquisition",
            "date_debut_amortissement",
            "duree_amortissement",
            "taux_amortissement",
            "mode_amortissement",
            "mode_amortissement_display",
            "valeur_residuelle",
            "ecritures",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "immobilisation_code",
            "immobilisation_designation",
            "mode_amortissement_display",
            "ecritures",
            "created_at",
            "updated_at",
        ]

    def validate(self, attrs):
        from decimal import Decimal
        from django.utils import timezone
        immobilisation = attrs.get("immobilisation")
        if not attrs.get("valeur_acquisition") and immobilisation:
            attrs["valeur_acquisition"] = immobilisation.valeur_acquisition or Decimal("0.00")
        if not attrs.get("date_debut_amortissement") and immobilisation:
            attrs["date_debut_amortissement"] = immobilisation.date_mise_en_service or immobilisation.date_acquisition or timezone.now().date()
        
        duree = attrs.get("duree_amortissement")
        if duree and (not attrs.get("taux_amortissement") or attrs.get("taux_amortissement") <= 0):
            attrs["taux_amortissement"] = (Decimal(100) / Decimal(duree)).quantize(Decimal("0.01"))
            
        return attrs
