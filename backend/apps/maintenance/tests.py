from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIClient

from apps.users.models import Entreprise
from apps.immobilisations.models import Immobilisation, Famille
from .models import ContratMaintenance, ImmobilisationContrat, Intervention, Alerte

User = get_user_model()


class MaintenanceTestCase(TestCase):
    def setUp(self):
        self.entreprise = Entreprise.objects.create(
            nom="Maintenance Test Corp",
            matricule_fiscal="MF999888",
        )
        self.user = User.objects.create_user(
            username="techuser",
            password="Password123!",
            entreprise=self.entreprise,
        )
        self.famille = Famille.objects.create(
            nom="Climatisation",
            code="CLM",
            entreprise=self.entreprise,
        )
        self.asset = Immobilisation.objects.create(
            code_inventaire="CLM-001",
            entreprise=self.entreprise,
            designation="Climatiseur LG 24000 BTU",
            famille=self.famille,
            valeur_acquisition=3500.00,
        )
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

    def test_create_contrat_and_assign_asset(self):
        response = self.client.post(
            "/api/contrats/",
            {
                "reference": "CTR-2026-001",
                "fournisseur": "SOTUCLIM",
                "date_debut": "2026-01-01",
                "date_fin": "2026-12-31",
                "montant": "1200.00",
                "type_maintenance": "preventive",
                "periodicite": "mensuelle",
            },
            format="json",
        )
        if response.status_code != 201: print('ERR DATA:', response.data)
        self.assertEqual(response.status_code, 201)
        contrat_id = response.data["id"]

        # Assign asset
        assign_res = self.client.post(
            f"/api/contrats/{contrat_id}/assign_immobilisations/",
            {"immobilisations": [self.asset.id]},
            format="json",
        )
        self.assertEqual(assign_res.status_code, 200)
        self.assertEqual(len(assign_res.data["immobilisations_details"]), 1)

    def test_create_intervention_and_alerte(self):
        contrat = ContratMaintenance.objects.create(
            reference="CTR-2026-002",
            entreprise=self.entreprise,
            fournisseur="TECHSERVE",
            date_debut="2026-01-01",
            date_fin="2026-12-31",
            montant=2000.00,
        )
        int_res = self.client.post(
            "/api/interventions/",
            {
                "contrat": contrat.id,
                "immobilisation": self.asset.id,
                "date_intervention": "2026-06-15",
                "type_intervention": "Vidange & Nettoyage Filtres",
                "technicien": "Ali Ben Salah",
                "cout": "150.00",
                "statut": "planifie",
            },
            format="json",
        )
        self.assertEqual(int_res.status_code, 201)

        # Test Alerte
        alerte = Alerte.objects.create(
            contrat=contrat,
            type_alerte="expiration_contrat",
            message="Le contrat CTR-2026-002 expire dans 30 jours",
            destinataire=self.user,
        )
        self.assertEqual(alerte.statut_lecture, "non_lu")

        # Mark read via API
        read_res = self.client.post(f"/api/alertes/{alerte.id}/marquer_lu/")
        self.assertEqual(read_res.status_code, 200)
        self.assertEqual(read_res.data["statut_lecture"], "lu")
