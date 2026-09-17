from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.utils import timezone

from .models import Departement, Entreprise, Permission, Role, RolePermission, User
from .services import approve_entreprise, reject_entreprise


@admin.action(description="Approuver les entreprises sélectionnées")
def approuver_entreprises_action(modeladmin, request, queryset):
    count = 0
    for entreprise in queryset:
        approve_entreprise(entreprise)
        count += 1
    modeladmin.message_user(
        request,
        f"{count} entreprise(s) approuvée(s) avec succès. Les rôles Admin et comptes administrateurs ont été créés et activés.",
    )


@admin.action(description="Rejeter les entreprises sélectionnées")
def rejeter_entreprises_action(modeladmin, request, queryset):
    count = 0
    for entreprise in queryset:
        reject_entreprise(entreprise, motif_rejet="Demande rejetée via l'administration Django.")
        count += 1
    modeladmin.message_user(
        request,
        f"{count} entreprise(s) rejetée(s). Les comptes administrateurs ont été désactivés.",
    )


@admin.register(Entreprise)
class EntrepriseAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "nom",
        "matricule_fiscal",
        "email",
        "telephone",
        "secteur_activite",
        "statut_validation",
        "actif",
        "date_demande",
        "date_validation",
    )

    search_fields = (
        "nom",
        "matricule_fiscal",
        "email",
        "secteur_activite",
    )

    list_filter = (
        "statut_validation",
        "actif",
        "secteur_activite",
    )

    readonly_fields = ("date_demande",)

    actions = [approuver_entreprises_action, rejeter_entreprises_action]

    def save_model(self, request, obj, form, change):
        super().save_model(request, obj, form, change)
        if change and "statut_validation" in form.changed_data:
            if obj.statut_validation == Entreprise.STATUT_APPROUVE:
                approve_entreprise(obj)
            elif obj.statut_validation == Entreprise.STATUT_REJETE:
                reject_entreprise(obj, motif_rejet=obj.motif_rejet or "Modifié dans l'admin Django")


@admin.register(Permission)
class PermissionAdmin(admin.ModelAdmin):
    list_display = ("code", "nom", "module")
    search_fields = ("code", "nom", "module")
    list_filter = ("module",)


class RolePermissionInline(admin.TabularInline):
    model = RolePermission
    extra = 1


@admin.register(Role)
class RoleAdmin(admin.ModelAdmin):
    list_display = ("id", "nom", "entreprise", "actif", "date_creation")
    search_fields = ("nom", "description", "entreprise__nom")
    list_filter = ("entreprise", "actif")
    inlines = [RolePermissionInline]


@admin.register(Departement)
class DepartementAdmin(admin.ModelAdmin):
    list_display = ("id", "nom", "entreprise", "responsable", "actif", "date_creation")
    search_fields = ("nom", "entreprise__nom", "responsable__username")
    list_filter = ("entreprise", "actif")


@admin.register(User)
class CustomUserAdmin(UserAdmin):
    list_display = (
        "username",
        "email",
        "first_name",
        "last_name",
        "entreprise",
        "role",
        "departement",
        "statut_compte",
        "est_admin_entreprise",
        "actif",
        "is_active",
    )

    search_fields = (
        "username",
        "email",
        "first_name",
        "last_name",
        "telephone",
    )

    list_filter = (
        "statut_compte",
        "est_admin_entreprise",
        "actif",
        "is_active",
        "is_staff",
        "is_superuser",
        "entreprise",
        "role",
        "departement",
    )

    fieldsets = tuple(UserAdmin.fieldsets or ()) + (
        (
            "Informations professionnelles",
            {
                "fields": (
                    "entreprise",
                    "role",
                    "departement",
                    "telephone",
                    "statut_compte",
                    "est_admin_entreprise",
                    "actif",
                )
            },
        ),
    )