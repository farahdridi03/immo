import os
import logging
from django.utils import timezone
from django.core.mail import send_mail
from django.conf import settings
from .models import Entreprise, User, Role, Permission, RolePermission

logger = logging.getLogger(__name__)


def send_approval_email(user: User, entreprise: Entreprise | None = None):
    """
    Sends an email notification to the user that their account / company has been approved.
    """
    if not user.email:
        return

    ent = entreprise or user.entreprise
    ent_nom = ent.nom if ent else "GestImmo"
    app_url = os.getenv("FRONTEND_URL", getattr(settings, "FRONTEND_URL", "http://localhost:3000/login"))

    subject = f"Validation de votre compte - {ent_nom}"
    message = (
        f"Bonjour {user.first_name or user.username},\n\n"
        f"Votre compte pour l'entreprise '{ent_nom}' a été validé avec succès par l'administrateur de la plateforme.\n"
        f"Votre compte est désormais actif et vous pouvez vous connecter.\n\n"
        f"• Lien de connexion : {app_url}\n"
        f"• Nom d'utilisateur : {user.username}\n\n"
        f"Cordialement,\n"
        f"L'équipe GestImmo"
    )

    try:
        from_email = getattr(settings, "DEFAULT_FROM_EMAIL", os.getenv("DEFAULT_FROM_EMAIL", "noreply@gestimmo.tn"))
        send_mail(
            subject=subject,
            message=message,
            from_email=from_email,
            recipient_list=[user.email],
            fail_silently=False,
        )
        logger.info(f"Email d'approbation envoyé avec succès à {user.email}")
    except Exception as e:
        logger.error(f"Erreur lors de l'envoi de l'email d'approbation à {user.email}: {e}")


def send_new_user_credentials_email(user: User, raw_password: str, entreprise: Entreprise | None = None):
    """
    Sends an email with login credentials (application link, username, and password)
    to a newly created user.
    """
    if not user.email:
        logger.warning(f"Impossible d'envoyer les identifiants : l'utilisateur {user.username} n'a pas d'adresse email.")
        return False

    ent = entreprise or getattr(user, "entreprise", None)
    ent_nom = ent.nom if ent else "GestImmo"
    app_url = os.getenv("FRONTEND_URL", getattr(settings, "FRONTEND_URL", "http://localhost:3000/login"))

    subject = f"Vos identifiants de connexion - GestImmo ({ent_nom})"
    message = (
        f"Bonjour {user.first_name or user.username},\n\n"
        f"Un compte utilisateur a été créé pour vous sur la plateforme GestImmo pour l'entreprise '{ent_nom}'.\n\n"
        f"Voici vos identifiants pour vous connecter à l'application :\n"
        f"━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"
        f"• Lien de l'application : {app_url}\n"
        f"• Nom d'utilisateur     : {user.username}\n"
        f"• Mot de passe          : {raw_password}\n"
        f"━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n"
        f"Pour des raisons de sécurité, nous vous recommandons de modifier votre mot de passe après votre première connexion.\n\n"
        f"Cordialement,\n"
        f"L'équipe GestImmo"
    )

    html_message = f"""
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #1C1917; background-color: #FAF8F2; margin: 0; padding: 24px;">
        <div style="max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #E0DACB; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
            <div style="background-color: #483C2C; padding: 28px 24px; text-align: center;">
                <h1 style="color: #FAF8F2; margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.5px;">GestImmo</h1>
                <p style="color: #E0DACB; margin: 6px 0 0 0; font-size: 13px;">Gestion Intelligente des Immobilisations & Actifs</p>
            </div>
            
            <div style="padding: 32px 28px;">
                <h2 style="color: #1C1917; margin-top: 0; font-size: 18px; font-weight: 600;">Bienvenue sur GestImmo</h2>
                <p style="font-size: 14px; color: #57534E;">Bonjour <strong>{user.first_name or user.username}</strong>,</p>
                <p style="font-size: 14px; color: #57534E;">Un compte d'accès vous a été créé par l'administrateur pour l'entreprise <strong>{ent_nom}</strong>.</p>
                
                <div style="background-color: #FAF8F2; border: 1px solid #E0DACB; border-left: 4px solid #483C2C; padding: 18px 20px; margin: 24px 0; border-radius: 8px;">
                    <p style="margin: 0 0 12px 0; font-size: 13px; font-weight: 700; color: #483C2C; text-transform: uppercase; letter-spacing: 0.5px;">Vos identifiants de connexion</p>
                    <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                        <tr>
                            <td style="padding: 6px 0; color: #78716C; width: 140px;">Nom d'utilisateur :</td>
                            <td style="padding: 6px 0; font-family: monospace; font-weight: 600; color: #1C1917;">{user.username}</td>
                        </tr>
                        <tr>
                            <td style="padding: 6px 0; color: #78716C;">Mot de passe :</td>
                            <td style="padding: 6px 0; font-family: monospace; font-weight: 700; color: #483C2C; font-size: 15px;">{raw_password}</td>
                        </tr>
                    </table>
                </div>

                <div style="text-align: center; margin: 28px 0;">
                    <a href="{app_url}" style="background-color: #483C2C; color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px; display: inline-block;">Accéder à l'application</a>
                </div>

                <p style="font-size: 12px; color: #78716C; margin-top: 24px; padding-top: 16px; border-top: 1px solid #E0DACB;">
                    Pour des raisons de sécurité, nous vous invitons à modifier votre mot de passe dès votre première connexion dans votre profil utilisateur.
                </p>
                <p style="font-size: 13px; color: #57534E; margin-bottom: 0;">
                    Cordialement,<br><strong>L'équipe GestImmo</strong>
                </p>
            </div>
        </div>
    </body>
    </html>
    """

    from_email = getattr(settings, "DEFAULT_FROM_EMAIL", os.getenv("DEFAULT_FROM_EMAIL", "noreply@gestimmo.tn"))

    try:
        send_mail(
            subject=subject,
            message=message,
            from_email=from_email,
            recipient_list=[user.email],
            html_message=html_message,
            fail_silently=False,
        )
        logger.info(f"Identifiants de connexion envoyés avec succès à {user.email} (utilisateur: {user.username})")
        return True
    except Exception as e:
        logger.error(f"Erreur lors de l'envoi des identifiants à {user.email}: {e}")
        return False


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


def ensure_default_permissions():
    """
    Ensures that all default system permissions exist in the database.
    """
    created_count = 0
    for perm_data in DEFAULT_PERMISSIONS:
        _, created = Permission.objects.get_or_create(
            code=perm_data["code"],
            defaults={
                "nom": perm_data["nom"],
                "module": perm_data["module"],
            },
        )
        if created:
            created_count += 1
    return created_count


def approve_entreprise(entreprise: Entreprise):
    """
    Approves an Entreprise:
    - Sets statut_validation to 'approuve', date_validation to now, actif to True.
    - Creates default 'Admin' role for the entreprise with all permissions.
    - Optionally creates default 'Gestionnaire' and 'Technicien' roles (empty permissions).
    - Activates the initial company admin user(s) (est_admin_entreprise=True) and assigns the Admin role.
    - Sends an email notification to the company admin(s).
    """
    ensure_default_permissions()

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
    admin_users = list(User.objects.filter(entreprise=entreprise, est_admin_entreprise=True))
    if not admin_users:
        admin_users = list(User.objects.filter(entreprise=entreprise))

    for u in admin_users:
        u.statut_compte = User.STATUT_ACTIF
        u.is_active = True
        u.actif = True
        if not u.role or u.est_admin_entreprise:
            u.role = admin_role
        u.save(update_fields=["statut_compte", "is_active", "actif", "role"])

    # 4. Email notification to all validated admins
    for u in admin_users:
        send_approval_email(u, entreprise)

    return entreprise


def approve_user(user: User):
    """
    Approves a User:
    - If user belongs to an entreprise that is pending approval or if user is est_admin_entreprise,
      approves the entire entreprise (validating the entreprise, creating roles, activating admins, sending emails).
    - Otherwise, activates the user, ensures a role is assigned, and sends approval email.
    """
    if user.entreprise and (user.est_admin_entreprise or user.entreprise.statut_validation == Entreprise.STATUT_EN_ATTENTE):
        approve_entreprise(user.entreprise)
        user.refresh_from_db()
        return user

    # Activate user
    user.statut_compte = User.STATUT_ACTIF
    user.is_active = True
    user.actif = True

    if user.entreprise and not user.role:
        target_role_name = "Admin" if user.est_admin_entreprise else "Gestionnaire"
        role = Role.objects.filter(entreprise=user.entreprise, nom=target_role_name).first()
        if not role:
            role = Role.objects.filter(entreprise=user.entreprise).first()
        if role:
            user.role = role

    user.save(update_fields=["statut_compte", "is_active", "actif", "role"])
    send_approval_email(user, user.entreprise)
    return user


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

    admin_users = list(User.objects.filter(entreprise=entreprise, est_admin_entreprise=True))
    if not admin_users:
        admin_users = list(User.objects.filter(entreprise=entreprise))

    for u in admin_users:
        u.statut_compte = User.STATUT_INACTIF
        u.is_active = False
        u.actif = False
        u.save(update_fields=["statut_compte", "is_active", "actif"])

    from_email = getattr(settings, "DEFAULT_FROM_EMAIL", os.getenv("DEFAULT_FROM_EMAIL", "noreply@gestimmo.tn"))
    for u in admin_users:
        if u.email:
            try:
                send_mail(
                    subject="Statut de votre demande d'inscription - GestImmo",
                    message=(
                        f"Bonjour {u.first_name or u.username},\n\n"
                        f"Nous vous informons que votre demande d'inscription pour l'entreprise '{entreprise.nom}' a été rejetée.\n"
                        f"Motif du rejet : {motif_rejet or 'Aucun motif spécifié'}.\n\n"
                        f"Cordialement,\n"
                        f"L'équipe GestImmo"
                    ),
                    from_email=from_email,
                    recipient_list=[u.email],
                    fail_silently=False,
                )
                logger.info(f"Email de rejet envoyé avec succès à {u.email}")
            except Exception as e:
                logger.error(f"Erreur lors de l'envoi de l'email de rejet à {u.email}: {e}")

    return entreprise


def reject_user(user: User, motif_rejet: str = ""):
    """
    Rejects or deactivates a user and sends notification email.
    """
    user.statut_compte = User.STATUT_INACTIF
    user.is_active = False
    user.actif = False
    user.save(update_fields=["statut_compte", "is_active", "actif"])

    if user.email:
        ent_nom = user.entreprise.nom if user.entreprise else "GestImmo"
        from_email = getattr(settings, "DEFAULT_FROM_EMAIL", os.getenv("DEFAULT_FROM_EMAIL", "noreply@gestimmo.tn"))
        try:
            send_mail(
                subject="Désactivation de votre compte - GestImmo",
                message=(
                    f"Bonjour {user.first_name or user.username},\n\n"
                    f"Votre compte pour l'entreprise '{ent_nom}' a été désactivé ou rejeté.\n"
                    f"Motif : {motif_rejet or 'Non spécifié'}.\n\n"
                    f"Cordialement,\n"
                    f"L'équipe GestImmo"
                ),
                from_email=from_email,
                recipient_list=[user.email],
                fail_silently=False,
            )
            logger.info(f"Email de désactivation envoyé avec succès à {user.email}")
        except Exception as e:
            logger.error(f"Erreur lors de l'envoi de l'email de désactivation à {user.email}: {e}")

    return user
