from django.db import migrations

DEFAULT_PERMISSIONS = [
    # Familles
    {"code": "view_familles", "nom": "Consulter les familles d'actifs", "module": "familles"},
    {"code": "gerer_familles", "nom": "Gérer les familles (créer, modifier, supprimer)", "module": "familles"},

    # Immobilisations
    {"code": "view_immobilisations", "nom": "Consulter les immobilisations", "module": "immobilisations"},
    {"code": "gerer_immobilisations", "nom": "Créer et modifier des immobilisations", "module": "immobilisations"},
    {"code": "delete_immobilisations", "nom": "Supprimer ou réformer des immobilisations", "module": "immobilisations"},
    {"code": "export_immobilisations", "nom": "Exporter les immobilisations (PDF/Excel)", "module": "immobilisations"},
    {"code": "gerer_inventaire", "nom": "Effectuer et valider les inventaires physiques", "module": "immobilisations"},

    # Emplacements
    {"code": "view_emplacements", "nom": "Consulter les emplacements et sites", "module": "emplacements"},
    {"code": "gerer_emplacements", "nom": "Gérer les emplacements (créer, modifier, supprimer)", "module": "emplacements"},

    # Amortissements
    {"code": "view_amortissements", "nom": "Consulter les plans d'amortissement", "module": "amortissements"},
    {"code": "gerer_amortissements", "nom": "Calculer et générer les dotations d'amortissement", "module": "amortissements"},
    {"code": "export_amortissements", "nom": "Exporter les tableaux d'amortissement comptables", "module": "amortissements"},

    # Maintenance
    {"code": "view_maintenance", "nom": "Consulter les contrats et interventions de maintenance", "module": "maintenance"},
    {"code": "gerer_maintenance", "nom": "Créer et planifier des interventions et contrats", "module": "maintenance"},
    {"code": "delete_maintenance", "nom": "Supprimer des contrats ou interventions", "module": "maintenance"},

    # Utilisateurs & Rôles
    {"code": "view_users", "nom": "Consulter la liste des utilisateurs et départements", "module": "users"},
    {"code": "manage_users", "nom": "Gérer les comptes utilisateurs (création, activation)", "module": "users"},
    {"code": "manage_roles", "nom": "Gérer les rôles et permissions", "module": "users"},

    # Audit & Traçabilité
    {"code": "view_audit", "nom": "Consulter l'historique d'audit et les journaux", "module": "audit"},

    # Entreprise & Paramètres
    {"code": "manage_entreprises", "nom": "Gérer les informations et paramètres de l'entreprise", "module": "entreprises"},
    {"code": "config_alertes", "nom": "Configurer les seuils et alertes de notifications", "module": "entreprises"},
]


def seed_permissions(apps, schema_editor):
    Permission = apps.get_model("users", "Permission")
    Role = apps.get_model("users", "Role")
    RolePermission = apps.get_model("users", "RolePermission")

    created_perms = []
    for item in DEFAULT_PERMISSIONS:
        perm, _ = Permission.objects.get_or_create(
            code=item["code"],
            defaults={"nom": item["nom"], "module": item["module"]},
        )
        created_perms.append(perm)

    admin_roles = Role.objects.filter(nom="Admin")
    for role in admin_roles:
        for perm in created_perms:
            RolePermission.objects.get_or_create(role=role, permission=perm)


def unseed_permissions(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ("users", "0010_historicalrole"),
    ]

    operations = [
        migrations.RunPython(seed_permissions, reverse_code=unseed_permissions),
    ]
