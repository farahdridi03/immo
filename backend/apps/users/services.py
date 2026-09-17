from django.utils import timezone
from django.core.mail import send_mail
from django.conf import settings
from .models import Entreprise, User, Role, Permission, RolePermission


def approve_entreprise(entreprise: Entreprise):
    """
    Approves an Entreprise:
    - Sets statut_validation to 'approuve', date_validation to now, actif to True.
    - Creates default 'Admin' role for the entreprise with all permissions.
    - Optionally creates default 'Gestionnaire' and 'Technicien' roles (empty permissions).
    - Activates the initial company admin user(s) (est_admin_entreprise=True) and assigns the Admin role.
    - Sends an email notification to the company admin.
    """
    entreprise.statut_validation = Entreprise.STATUT_APPROUVE
    entreprise.date_validation = timezone.now()
    entreprise.actif = True
    entreprise.save(update_fields=["statut_validation", "date_validation", "actif"])

    # 1. Create or get "Admin" role with all permissions
    admin_role, _ = Role.objects.get_or_create(
        nom="Admin",
        entreprise=entreprise,
        defaults={"description": "Rôle Administrateur Entreprise (accès complet à toutes les fonctionnalités)"},
    )

    all_permissions = Permission.objects.all()
    for perm in all_permissions:
        RolePermission.objects.get_or_create(role=admin_role, permission=perm)

    # 2. Create optional default roles (empty permissions)
    Role.objects.get_or_create(
        nom="Gestionnaire",
        entreprise=entreprise,
        defaults={"description": "Rôle Gestionnaire par défaut"},
    )
    Role.objects.get_or_create(
        nom="Technicien",
        entreprise=entreprise,
        defaults={"description": "Rôle Technicien par défaut"},
    )

    # 3. Update company admin users
    admin_users = User.objects.filter(entreprise=entreprise, est_admin_entreprise=True)
    for u in admin_users:
        u.statut_compte = User.STATUT_ACTIF
        u.is_active = True
        u.actif = True
        u.role = admin_role
        u.save(update_fields=["statut_compte", "is_active", "actif", "role"])

    # If no est_admin_entreprise, activate all users of this entreprise as fallback
    if not admin_users.exists():
        for u in User.objects.filter(entreprise=entreprise):
            u.statut_compte = User.STATUT_ACTIF
            u.is_active = True
            u.actif = True
            if not u.role:
                u.role = admin_role
            u.save(update_fields=["statut_compte", "is_active", "actif", "role"])

    # 4. Email notification
    recipients = [u.email for u in admin_users if u.email]
    if recipients:
        try:
            send_mail(
                subject="Validation de votre compte entreprise - GestImmo",
                message=(
                    f"Bonjour,\n\n"
                    f"Votre entreprise '{entreprise.nom}' a été validée avec succès par l'administrateur de la plateforme.\n"
                    f"Votre compte administrateur est désormais actif et vous pouvez vous connecter.\n\n"
                    f"Cordialement,\n"
                    f"L'équipe GestImmo"
                ),
                from_email=getattr(settings, "DEFAULT_FROM_EMAIL", "noreply@gestimmo.tn"),
                recipient_list=recipients,
                fail_silently=True,
            )
        except Exception:
            pass

    return entreprise


def reject_entreprise(entreprise: Entreprise, motif_rejet: str = ""):
    """
    Rejects an Entreprise:
    - Sets statut_validation to 'rejete', date_validation to now, saves motif_rejet, actif to False.
    - Sets company admin user(s) to inactif.
    - Sends email notification with motif_rejet.
    """
    entreprise.statut_validation = Entreprise.STATUT_REJETE
    entreprise.date_validation = timezone.now()
    entreprise.motif_rejet = motif_rejet
    entreprise.actif = False
    entreprise.save(update_fields=["statut_validation", "date_validation", "motif_rejet", "actif"])

    admin_users = User.objects.filter(entreprise=entreprise, est_admin_entreprise=True)
    for u in admin_users:
        u.statut_compte = User.STATUT_INACTIF
        u.is_active = False
        u.actif = False
        u.save(update_fields=["statut_compte", "is_active", "actif"])

    recipients = [u.email for u in admin_users if u.email]
    if recipients:
        try:
            send_mail(
                subject="Statut de votre demande d'inscription - GestImmo",
                message=(
                    f"Bonjour,\n\n"
                    f"Nous vous informons que votre demande d'inscription pour l'entreprise '{entreprise.nom}' a été rejetée.\n"
                    f"Motif du rejet : {motif_rejet or 'Aucun motif spécifié'}.\n\n"
                    f"Cordialement,\n"
                    f"L'équipe GestImmo"
                ),
                from_email=getattr(settings, "DEFAULT_FROM_EMAIL", "noreply@gestimmo.tn"),
                recipient_list=recipients,
                fail_silently=True,
            )
        except Exception:
            pass

    return entreprise
