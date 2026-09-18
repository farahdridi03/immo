import datetime
from rest_framework.test import APITestCase
from rest_framework import status
from apps.users.models import User, Entreprise, Role
from apps.immobilisations.models import Immobilisation, Famille, PlanAmortissement

class AuditTrailEnterpriseIsolationTest(APITestCase):
    def setUp(self):
        # Enterprise A
        self.entreprise_a = Entreprise.objects.create(
            nom="Enterprise A",
            matricule_fiscal="MF-AAAA1111",
            statut_validation=Entreprise.STATUT_APPROUVE,
        )
        self.user_a = User.objects.create_user(
            username="admin_a",
            email="admin_a@test.com",
            password="Password123!",
            entreprise=self.entreprise_a,
            est_admin_entreprise=True,
        )

        # Enterprise B
        self.entreprise_b = Entreprise.objects.create(
            nom="Enterprise B",
            matricule_fiscal="MF-BBBB2222",
            statut_validation=Entreprise.STATUT_APPROUVE,
        )
        self.user_b = User.objects.create_user(
            username="admin_b",
            email="admin_b@test.com",
            password="Password123!",
            entreprise=self.entreprise_b,
            est_admin_entreprise=True,
        )

        # Create Immobilisation for Enterprise A
        self.immo_a = Immobilisation.objects.create(
            code_inventaire="INV-A001",
            designation="Laptop A",
            entreprise=self.entreprise_a,
            valeur_acquisition=1000,
        )

        # Create Immobilisation for Enterprise B
        self.immo_b = Immobilisation.objects.create(
            code_inventaire="INV-B001",
            designation="Laptop B",
            entreprise=self.entreprise_b,
            valeur_acquisition=2000,
        )

    def test_audit_trail_only_shows_user_entreprise_records(self):
        # Authenticate as User A
        self.client.force_authenticate(user=self.user_a)
        response = self.client.get("/api/audit-trail/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        entries = response.json()

        # Should contain entries for Enterprise A (User A, Laptop A)
        # Should NOT contain any entries for Enterprise B (User B, Laptop B)
        for entry in entries:
            self.assertNotIn("Laptop B", entry["objet_concerne"])
            self.assertNotIn("INV-B001", entry["objet_concerne"])
            self.assertNotIn("admin_b", entry["qui"])

        # Authenticate as User B
        self.client.force_authenticate(user=self.user_b)
        response_b = self.client.get("/api/audit-trail/")

        self.assertEqual(response_b.status_code, status.HTTP_200_OK)
        entries_b = response_b.json()

        for entry in entries_b:
            self.assertNotIn("Laptop A", entry["objet_concerne"])
            self.assertNotIn("INV-A001", entry["objet_concerne"])
            self.assertNotIn("admin_a", entry["qui"])

    def test_famille_creation_and_modification_in_audit_trail(self):
        self.client.force_authenticate(user=self.user_a)

        # Create a Famille
        famille = Famille.objects.create(
            nom="Informatique",
            code="FAM-INF",
            description="Matériel informatique",
            entreprise=self.entreprise_a,
        )

        # Modify Famille
        famille.nom = "Informatique & Tech"
        famille.save()

        # Fetch audit trail with filter entite=famille
        response = self.client.get("/api/audit-trail/?entite=famille")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        entries = response.json()
        self.assertTrue(any(e["entite"] == "Famille d'Immobilisation" for e in entries))
        
        # Verify creation and modification entries exist
        creation = next((e for e in entries if e["action_code"] == "+"), None)
        self.assertIsNotNone(creation)
        self.assertIn("Informatique", creation["objet_concerne"])

        modification = next((e for e in entries if e["action_code"] == "~"), None)
        self.assertIsNotNone(modification)

    def test_amortissement_and_role_in_audit_trail(self):
        self.client.force_authenticate(user=self.user_a)

        # Create PlanAmortissement for Enterprise A's immobilisation
        plan = PlanAmortissement.objects.create(
            immobilisation=self.immo_a,
            valeur_acquisition=1000,
            date_debut_amortissement=datetime.date(2026, 1, 1),
            duree_amortissement=5,
            taux_amortissement=20.00,
            mode_amortissement=PlanAmortissement.MODE_LINEAIRE,
        )
        plan.duree_amortissement = 6
        plan.save()

        # Create Role for Enterprise A
        role = Role.objects.create(
            nom="Gestionnaire de Parc",
            description="Accès complet au parc",
            entreprise=self.entreprise_a,
        )

        # Test Amortissement audit filter
        res_amort = self.client.get("/api/audit-trail/?entite=amortissement")
        self.assertEqual(res_amort.status_code, status.HTTP_200_OK)
        entries_amort = res_amort.json()
        self.assertTrue(any(e["entite"] == "Amortissement" for e in entries_amort))

        # Test Role audit filter
        res_role = self.client.get("/api/audit-trail/?entite=role")
        self.assertEqual(res_role.status_code, status.HTTP_200_OK)
        entries_role = res_role.json()
        self.assertTrue(any(e["entite"] == "Rôle / Permission" for e in entries_role))
        self.assertTrue(any("Gestionnaire de Parc" in e["objet_concerne"] for e in entries_role))
