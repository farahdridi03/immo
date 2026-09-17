from django.test import TestCase
from rest_framework.test import APIClient, APITestCase
from apps.users.models import Departement, Entreprise, Permission, Role, RolePermission, User
from apps.users.serializers import (
    DepartementSerializer,
    EntrepriseSerializer,
    PermissionSerializer,
    RoleSerializer,
    UserSerializer,
)
from apps.users.services import approve_entreprise, reject_entreprise


class EntrepriseModelTest(TestCase):
    def test_create_entreprise(self):
        entreprise = Entreprise.objects.create(
            nom="TechCorp",
            matricule_fiscal="MF-12345678",
            adresse="123 Rue Innovation, Tunis",
            telephone="+216 71 000 000",
            email="contact@techcorp.tn",
            secteur_activite="Informatique",
            actif=True,
        )
        self.assertEqual(entreprise.nom, "TechCorp")
        self.assertEqual(entreprise.matricule_fiscal, "MF-12345678")
        self.assertEqual(entreprise.statut_validation, Entreprise.STATUT_EN_ATTENTE)
        self.assertEqual(str(entreprise), "TechCorp")

    def test_entreprise_serializer(self):
        entreprise = Entreprise.objects.create(
            nom="Innovate SA",
            matricule_fiscal="MF-87654321",
            secteur_activite="Fintech",
        )
        serializer = EntrepriseSerializer(entreprise)
        data = serializer.data
        self.assertIn("id", data)
        self.assertEqual(data["nom"], "Innovate SA")
        self.assertEqual(data["matricule_fiscal"], "MF-87654321")
        self.assertEqual(data["secteur_activite"], "Fintech")
        self.assertIn("date_creation", data)
        self.assertIn("statut_validation", data)
        self.assertNotIn("code", data)

    def test_entreprise_serializer_clear_logo(self):
        entreprise = Entreprise.objects.create(
            nom="Logo Test SA",
            logo="entreprises/logos/test.png",
        )
        serializer = EntrepriseSerializer(instance=entreprise, data={"logo": None}, partial=True)
        self.assertTrue(serializer.is_valid(), serializer.errors)
        updated = serializer.save()
        self.assertFalse(bool(updated.logo))



class UserModelHierarchyTest(TestCase):
    def setUp(self):
        self.entreprise = Entreprise.objects.create(
            nom="Global Solutions",
            matricule_fiscal="MF-999999",
            statut_validation=Entreprise.STATUT_APPROUVE,
            actif=True,
        )
        self.perm1 = Permission.objects.create(
            code="immobilisation.create",
            nom="Creer une immobilisation",
            module="inventaire",
        )
        self.perm2 = Permission.objects.create(
            code="contrat.delete",
            nom="Supprimer un contrat",
            module="maintenance",
        )
        self.role = Role.objects.create(
            nom="Gestionnaire Inventaire",
            description="Acces complet au module inventaire",
            entreprise=self.entreprise,
        )
        RolePermission.objects.create(role=self.role, permission=self.perm1)
        RolePermission.objects.create(role=self.role, permission=self.perm2)

        self.user = User.objects.create_user(
            username="johndoe",
            email="john@globalsolutions.tn",
            first_name="John",
            last_name="Doe",
            entreprise=self.entreprise,
            role=self.role,
            telephone="+216 20 000 000",
            statut_compte=User.STATUT_ACTIF,
            actif=True,
            is_active=True,
        )
        self.departement = Departement.objects.create(
            nom="Direction Informatique",
            entreprise=self.entreprise,
            responsable=self.user,
        )
        self.user.departement = self.departement
        self.user.save()

    def test_permission_role_relations(self):
        self.assertEqual(self.role.permissions.count(), 2)
        self.assertIn(self.perm1, self.role.permissions.all())

    def test_departement_and_user_relations(self):
        self.assertEqual(self.user.entreprise, self.entreprise)
        self.assertEqual(self.user.role, self.role)
        self.assertEqual(self.user.departement, self.departement)
        self.assertEqual(self.departement.responsable, self.user)

    def test_user_serializer(self):
        serializer = UserSerializer(self.user)
        data = serializer.data
        self.assertEqual(data["username"], "johndoe")
        self.assertEqual(data["entreprise_nom"], "Global Solutions")
        self.assertEqual(data["role_nom"], "Gestionnaire Inventaire")
        self.assertEqual(data["departement_nom"], "Direction Informatique")
        self.assertEqual(data["statut_compte"], User.STATUT_ACTIF)
        self.assertEqual(set(data["permissions"]), {"immobilisation.create", "contrat.delete"})

    def test_role_serializer(self):
        serializer = RoleSerializer(self.role)
        data = serializer.data
        self.assertEqual(data["nom"], "Gestionnaire Inventaire")
        self.assertEqual(data["utilisateurs_count"], 1)
        self.assertEqual(len(data["permissions_details"]), 2)


class RegistrationAndApprovalWorkflowTest(APITestCase):
    def setUp(self):
        self.client = APIClient()
        self.perm1 = Permission.objects.create(code="manage_users", nom="Gérer utilisateurs", module="users")
        self.perm2 = Permission.objects.create(code="manage_roles", nom="Gérer rôles", module="users")

    def test_registration_and_approval_flow(self):
        # Step 1: Public Registration
        reg_payload = {
            "username": "admin_company",
            "email": "admin@mycompany.tn",
            "password": "Password123!",
            "first_name": "Alice",
            "last_name": "Smith",
            "entreprise_nom": "My New Company",
            "matricule_fiscal": "MF-777888",
            "secteur_activite": "Industrie",
        }
        res = self.client.post("/api/auth/register/", reg_payload, format="json")
        self.assertEqual(res.status_code, 201)

        user = User.objects.get(username="admin_company")
        entreprise = user.entreprise
        self.assertIsNotNone(entreprise)
        assert entreprise is not None

        # Assert pending status
        self.assertEqual(entreprise.statut_validation, Entreprise.STATUT_EN_ATTENTE)
        self.assertEqual(user.statut_compte, User.STATUT_EN_ATTENTE)
        self.assertTrue(user.est_admin_entreprise)
        self.assertFalse(user.is_active)

        # Login attempt before approval should fail
        login_res = self.client.post("/api/auth/login/", {"username": "admin_company", "password": "Password123!"})
        self.assertEqual(login_res.status_code, 401)

        # Step 2: Approval via service (triggered by Django admin action)
        approve_entreprise(entreprise)

        entreprise.refresh_from_db()
        user.refresh_from_db()

        self.assertEqual(entreprise.statut_validation, Entreprise.STATUT_APPROUVE)
        self.assertEqual(user.statut_compte, User.STATUT_ACTIF)
        self.assertTrue(user.is_active)
        self.assertIsNotNone(user.role)
        assert user.role is not None
        self.assertEqual(user.role.nom, "Admin")
        # Ensure all permissions are granted to company Admin role
        self.assertEqual(user.role.permissions.count(), 2)

        # Step 3: Login after approval should succeed
        login_res2 = self.client.post("/api/auth/login/", {"username": "admin_company", "password": "Password123!"})
        self.assertEqual(login_res2.status_code, 200)
        self.assertIn("access", login_res2.data)
        self.assertEqual(login_res2.data["user"]["role_nom"], "Admin")

    def test_rejection_flow(self):
        entreprise = Entreprise.objects.create(nom="Rejected Co")
        user = User.objects.create_user(
            username="rejected_admin",
            email="rej@co.tn",
            password="pass",
            entreprise=entreprise,
            est_admin_entreprise=True,
            statut_compte=User.STATUT_EN_ATTENTE,
            is_active=False,
        )
        reject_entreprise(entreprise, motif_rejet="Matricule invalide")
        entreprise.refresh_from_db()
        user.refresh_from_db()

        self.assertEqual(entreprise.statut_validation, Entreprise.STATUT_REJETE)
        self.assertEqual(entreprise.motif_rejet, "Matricule invalide")
        self.assertEqual(user.statut_compte, User.STATUT_INACTIF)
        self.assertFalse(user.is_active)


class ProfileAndTwoFactorAuthTest(APITestCase):
    def setUp(self):
        self.client = APIClient()
        self.entreprise = Entreprise.objects.create(nom="SecureCorp", statut_validation=Entreprise.STATUT_APPROUVE)
        self.user = User.objects.create_user(
            username="testuser",
            email="testuser@securecorp.tn",
            password="OldPassword123!",
            first_name="Test",
            last_name="User",
            telephone="+216 11 222 333",
            entreprise=self.entreprise,
            statut_compte=User.STATUT_ACTIF,
            is_active=True,
            actif=True,
        )
        self.client.force_authenticate(user=self.user)

    def test_get_and_update_profile(self):
        # GET profile
        res = self.client.get("/api/auth/me/")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data["username"], "testuser")
        self.assertEqual(res.data["first_name"], "Test")

        # PATCH profile
        patch_res = self.client.patch(
            "/api/auth/me/",
            {"first_name": "UpdatedName", "telephone": "+216 99 888 777"},
            format="json",
        )
        self.assertEqual(patch_res.status_code, 200)
        self.assertEqual(patch_res.data["first_name"], "UpdatedName")
        self.assertEqual(patch_res.data["telephone"], "+216 99 888 777")

    def test_change_password(self):
        # Change password with invalid old password
        res_fail = self.client.post(
            "/api/auth/change-password/",
            {"old_password": "WrongPassword", "new_password": "NewPassword123!", "confirm_password": "NewPassword123!"},
            format="json",
        )
        self.assertEqual(res_fail.status_code, 400)

        # Change password with valid details
        res_success = self.client.post(
            "/api/auth/change-password/",
            {"old_password": "OldPassword123!", "new_password": "NewPassword123!", "confirm_password": "NewPassword123!"},
            format="json",
        )
        self.assertEqual(res_success.status_code, 200)
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password("NewPassword123!"))

    def test_full_2fa_workflow(self):
        import pyotp

        # 1. Setup 2FA
        setup_res = self.client.post("/api/auth/2fa/setup/")
        self.assertEqual(setup_res.status_code, 200)
        self.assertIn("secret", setup_res.data)
        self.assertIn("qr_code", setup_res.data)
        secret = setup_res.data["secret"]

        # 2. Confirm 2FA with valid TOTP code
        totp = pyotp.TOTP(secret)
        valid_code = totp.now()

        confirm_res = self.client.post("/api/auth/2fa/confirm/", {"code": valid_code}, format="json")
        self.assertEqual(confirm_res.status_code, 200)
        self.assertIn("backup_codes", confirm_res.data)
        self.assertEqual(len(confirm_res.data["backup_codes"]), 10)

        self.user.refresh_from_db()
        self.assertTrue(self.user.two_factor_enabled)

        # 3. Login attempt with username/password should require 2FA
        unauthenticated_client = APIClient()
        login_res = unauthenticated_client.post(
            "/api/auth/login/",
            {"username": "testuser", "password": "OldPassword123!"},
            format="json",
        )
        self.assertEqual(login_res.status_code, 200)
        self.assertTrue(login_res.data.get("requires_2fa"))
        temp_token = login_res.data.get("temp_token")

        # 4. Verify 2FA login step with code
        verify_res = unauthenticated_client.post(
            "/api/auth/login/2fa/",
            {"temp_token": temp_token, "code": totp.now()},
            format="json",
        )
        self.assertEqual(verify_res.status_code, 200)
        self.assertIn("access", verify_res.data)

        # 5. Disable 2FA
        disable_res = self.client.post(
            "/api/auth/2fa/disable/",
            {"password": "OldPassword123!", "code": totp.now()},
            format="json",
        )
        self.assertEqual(disable_res.status_code, 200)

        self.user.refresh_from_db()
        self.assertFalse(self.user.two_factor_enabled)

