from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIClient

from apps.users.models import Entreprise
from .models import Emplacement, Famille, Immobilisation, MouvementEmplacement, PlanAmortissement, EcritureAmortissement

User = get_user_model()


class ImmobilisationsTestCase(TestCase):
    def setUp(self):
        self.entreprise = Entreprise.objects.create(
            nom="Test Corp",
            matricule_fiscal="MF123456",
        )
        self.user = User.objects.create_user(
            username="testuser",
            password="Password123!",
            entreprise=self.entreprise,
        )
        self.famille = Famille.objects.create(
            nom="Informatique",
            code="INF",
            entreprise=self.entreprise,
        )
        self.emp_bureau = Emplacement.objects.create(
            code_emplacement="EMP-01",
            entreprise=self.entreprise,
            nom_emplacement="Bureau 101",
            type="bureau",
        )
        self.emp_depot = Emplacement.objects.create(
            code_emplacement="EMP-02",
            entreprise=self.entreprise,
            nom_emplacement="Dépôt Central",
            type="depot",
        )
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

    def test_create_immobilisation(self):
        asset = Immobilisation.objects.create(
            code_inventaire="INV-001",
            entreprise=self.entreprise,
            designation="Serveur Rack Dell",
            famille=self.famille,
            emplacement_actuel=self.emp_bureau,
            valeur_acquisition=2500.00,
        )
        self.assertEqual(asset.code_inventaire, "INV-001")
        self.assertEqual(asset.emplacement_actuel, self.emp_bureau)

    def test_mouvement_emplacement_updates_asset_location(self):
        asset = Immobilisation.objects.create(
            code_inventaire="INV-002",
            entreprise=self.entreprise,
            designation="PC Portable Lenovo",
            famille=self.famille,
            emplacement_actuel=self.emp_bureau,
        )
        mouvement = MouvementEmplacement.objects.create(
            immobilisation=asset,
            ancien_emplacement=self.emp_bureau,
            nouvel_emplacement=self.emp_depot,
            responsable_transfert=self.user,
            motif="Réaffectation service technique",
        )
        self.assertEqual(mouvement.nouvel_emplacement, self.emp_depot)

        # Trigger view action logic test via API call
        response = self.client.post(
            "/api/mouvements-emplacement/",
            {
                "immobilisation": asset.id,
                "ancien_emplacement": self.emp_bureau.id,
                "nouvel_emplacement": self.emp_depot.id,
                "responsable_transfert": self.user.id,
                "motif": "Transfert via API",
            },
            format="json",
        )
        self.assertEqual(response.status_code, 201)
        asset.refresh_from_db()
        self.assertEqual(asset.emplacement_actuel, self.emp_depot)

    def test_plan_amortissement_lineaire_calculation(self):
        asset = Immobilisation.objects.create(
            code_inventaire="INV-003",
            entreprise=self.entreprise,
            designation="Imprimante Laser HP",
            famille=self.famille,
            valeur_acquisition=5000.00,
        )
        plan = PlanAmortissement.objects.create(
            immobilisation=asset,
            valeur_acquisition=5000.00,
            date_debut_amortissement="2026-01-01",
            duree_amortissement=5,
            taux_amortissement=20.00,
            mode_amortissement="lineaire",
            valeur_residuelle=0.00,
        )
        plan.calculate_schedule()
        ecritures = plan.ecritures.all()
        self.assertEqual(ecritures.count(), 5)
        last_ecriture = ecritures.last()
        self.assertEqual(float(last_ecriture.amortissement_cumule), 5000.00)
        self.assertEqual(float(last_ecriture.valeur_nette_comptable), 0.00)

    def test_plan_amortissement_api_create_and_recalculer(self):
        asset = Immobilisation.objects.create(
            code_inventaire="INV-004",
            entreprise=self.entreprise,
            designation="Véhicule de Fonction",
            famille=self.famille,
            valeur_acquisition=40000.00,
        )
        response = self.client.post(
            "/api/plans-amortissement/",
            {
                "immobilisation": asset.id,
                "valeur_acquisition": "40000.00",
                "date_debut_amortissement": "2026-01-01",
                "duree_amortissement": 5,
                "taux_amortissement": "20.00",
                "mode_amortissement": "degressif",
                "valeur_residuelle": "2000.00",
            },
            format="json",
        )
        self.assertEqual(response.status_code, 201)
        plan_id = response.data["id"]

        # Test recalculer endpoint
        recalc_res = self.client.post(f"/api/plans-amortissement/{plan_id}/recalculer/")
        self.assertEqual(recalc_res.status_code, 200)
        self.assertGreater(len(recalc_res.data["ecritures"]), 0)
