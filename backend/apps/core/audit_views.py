from django.db.models import Q
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions, status

from apps.immobilisations.models import Immobilisation, Emplacement, Famille, PlanAmortissement
from apps.maintenance.models import ContratMaintenance, Intervention
from apps.users.models import User, Role

class AuditTrailView(APIView):
    """
    API View returning structured Audit Trail logs across sensitive entities.
    Outputs: who (qui), what (quoi), when (quand), and old_value -> new_value (ancienne -> nouvelle valeur).
    Filtered to only show entries related to the authenticated user's enterprise.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        entity_filter = request.query_params.get("entite", "toutes")
        search_query = request.query_params.get("search", "").lower()
        limit = int(request.query_params.get("limit", 100))

        user = request.user
        entreprise = getattr(user, "entreprise", None)
        is_superuser = getattr(user, "is_superuser", False)

        audit_entries = []

        # Non-superuser without enterprise can see no records
        if not is_superuser and not entreprise:
            return Response([], status=status.HTTP_200_OK)

        # Helper to apply enterprise scoping
        def get_filtered_qs(history_manager, relation_path=None):
            qs = history_manager.select_related("history_user")
            if entreprise:
                if relation_path == "intervention":
                    qs = qs.filter(
                        Q(immobilisation__entreprise=entreprise)
                        | Q(contrat__entreprise=entreprise)
                        | Q(history_user__entreprise=entreprise)
                    )
                elif relation_path == "immobilisation":
                    qs = qs.filter(
                        Q(immobilisation__entreprise=entreprise)
                        | Q(history_user__entreprise=entreprise)
                    )
                else:
                    qs = qs.filter(
                        Q(entreprise=entreprise) | Q(history_user__entreprise=entreprise)
                    )
            return qs[:limit]

        # Helper to format field diffs
        def extract_diffs(record):
            diffs = []
            try:
                prev = record.prev_record
                if prev:
                    delta = record.diff_against(prev)
                    for change in delta.changes:
                        # Ignore system timestamps
                        if change.field in ["updated_at", "date_calcul", "history_date"]:
                            continue
                        field_name = change.field.replace("_", " ").capitalize()
                        old_val = str(change.old) if change.old is not None else "-"
                        new_val = str(change.new) if change.new is not None else "-"
                        diffs.append({
                            "champ": field_name,
                            "ancienne_valeur": old_val,
                            "nouvelle_valeur": new_val,
                        })
            except Exception:
                pass
            return diffs

        # Helper to get user display string
        def get_user_display(record):
            if hasattr(record, "history_user") and record.history_user:
                u = record.history_user
                full_name = f"{u.first_name} {u.last_name}".strip() if (u.first_name or u.last_name) else u.username
                return f"{full_name} ({u.email or u.username})"
            return "Système / Admin"

        # Action mapping
        action_map = {
            "+": "Création",
            "~": "Modification",
            "-": "Suppression",
        }

        # 1. Immobilisations
        if entity_filter in ["toutes", "immobilisation"] and hasattr(Immobilisation, "history"):
            qs = get_filtered_qs(Immobilisation.history)
            for h in qs:
                action_label = action_map.get(h.history_type, "Action")
                obj_repr = f"{h.designation} ({h.code_inventaire})"
                diffs = extract_diffs(h) if h.history_type == "~" else []

                audit_entries.append({
                    "id": f"immo_{h.history_id}",
                    "quand": h.history_date.isoformat(),
                    "qui": get_user_display(h),
                    "entite": "Immobilisation",
                    "type_action": action_label,
                    "action_code": h.history_type,
                    "objet_concerne": obj_repr,
                    "modifications": diffs,
                })

        # 2. Contrats
        if entity_filter in ["toutes", "contrat"] and hasattr(ContratMaintenance, "history"):
            qs = get_filtered_qs(ContratMaintenance.history)
            for h in qs:
                action_label = action_map.get(h.history_type, "Action")
                obj_repr = f"Contrat {h.reference} ({h.fournisseur})"
                diffs = extract_diffs(h) if h.history_type == "~" else []

                audit_entries.append({
                    "id": f"contrat_{h.history_id}",
                    "quand": h.history_date.isoformat(),
                    "qui": get_user_display(h),
                    "entite": "Contrat de Maintenance",
                    "type_action": action_label,
                    "action_code": h.history_type,
                    "objet_concerne": obj_repr,
                    "modifications": diffs,
                })

        # 3. Emplacements
        if entity_filter in ["toutes", "emplacement"] and hasattr(Emplacement, "history"):
            qs = get_filtered_qs(Emplacement.history)
            for h in qs:
                action_label = action_map.get(h.history_type, "Action")
                obj_repr = f"{h.nom_emplacement} ({h.code_emplacement})"
                diffs = extract_diffs(h) if h.history_type == "~" else []

                audit_entries.append({
                    "id": f"emp_{h.history_id}",
                    "quand": h.history_date.isoformat(),
                    "qui": get_user_display(h),
                    "entite": "Emplacement",
                    "type_action": action_label,
                    "action_code": h.history_type,
                    "objet_concerne": obj_repr,
                    "modifications": diffs,
                })

        # 4. Interventions
        if entity_filter in ["toutes", "intervention"] and hasattr(Intervention, "history"):
            qs = get_filtered_qs(Intervention.history, relation_path="intervention")
            for h in qs:
                action_label = action_map.get(h.history_type, "Action")
                obj_repr = f"Intervention #{h.id} - {h.type_intervention}"
                diffs = extract_diffs(h) if h.history_type == "~" else []

                audit_entries.append({
                    "id": f"interv_{h.history_id}",
                    "quand": h.history_date.isoformat(),
                    "qui": get_user_display(h),
                    "entite": "Intervention",
                    "type_action": action_label,
                    "action_code": h.history_type,
                    "objet_concerne": obj_repr,
                    "modifications": diffs,
                })

        # 5. Utilisateurs
        if entity_filter in ["toutes", "utilisateur"] and hasattr(User, "history"):
            qs = get_filtered_qs(User.history)
            for h in qs:
                action_label = action_map.get(h.history_type, "Action")
                obj_repr = f"Utilisateur {h.username} ({h.email})"
                diffs = extract_diffs(h) if h.history_type == "~" else []

                audit_entries.append({
                    "id": f"user_{h.history_id}",
                    "quand": h.history_date.isoformat(),
                    "qui": get_user_display(h),
                    "entite": "Utilisateur",
                    "type_action": action_label,
                    "action_code": h.history_type,
                    "objet_concerne": obj_repr,
                    "modifications": diffs,
                })

        # 6. Familles
        if entity_filter in ["toutes", "famille"] and hasattr(Famille, "history"):
            qs = get_filtered_qs(Famille.history)
            for h in qs:
                action_label = action_map.get(h.history_type, "Action")
                obj_repr = f"Famille {h.nom} ({h.code})"
                diffs = extract_diffs(h) if h.history_type == "~" else []

                audit_entries.append({
                    "id": f"fam_{h.history_id}",
                    "quand": h.history_date.isoformat(),
                    "qui": get_user_display(h),
                    "entite": "Famille d'Immobilisation",
                    "type_action": action_label,
                    "action_code": h.history_type,
                    "objet_concerne": obj_repr,
                    "modifications": diffs,
                })

        # 7. Plans d'Amortissement
        if entity_filter in ["toutes", "amortissement"] and hasattr(PlanAmortissement, "history"):
            qs = get_filtered_qs(PlanAmortissement.history, relation_path="immobilisation")
            for h in qs:
                action_label = action_map.get(h.history_type, "Action")
                obj_repr = f"Plan d'Amortissement ({h.mode_amortissement}) - Durée: {h.duree_amortissement} an(s)"
                diffs = extract_diffs(h) if h.history_type == "~" else []

                audit_entries.append({
                    "id": f"amort_{h.history_id}",
                    "quand": h.history_date.isoformat(),
                    "qui": get_user_display(h),
                    "entite": "Amortissement",
                    "type_action": action_label,
                    "action_code": h.history_type,
                    "objet_concerne": obj_repr,
                    "modifications": diffs,
                })

        # 8. Rôles et Permissions
        if entity_filter in ["toutes", "role", "permission"] and hasattr(Role, "history"):
            qs = get_filtered_qs(Role.history)
            for h in qs:
                action_label = action_map.get(h.history_type, "Action")
                obj_repr = f"Rôle {h.nom}"
                diffs = extract_diffs(h) if h.history_type == "~" else []

                audit_entries.append({
                    "id": f"role_{h.history_id}",
                    "quand": h.history_date.isoformat(),
                    "qui": get_user_display(h),
                    "entite": "Rôle / Permission",
                    "type_action": action_label,
                    "action_code": h.history_type,
                    "objet_concerne": obj_repr,
                    "modifications": diffs,
                })

        # Sort audit entries by timestamp descending
        audit_entries.sort(key=lambda x: x["quand"], reverse=True)

        # Apply search filter if present
        if search_query:
            audit_entries = [
                e for e in audit_entries
                if search_query in e["qui"].lower()
                or search_query in e["entite"].lower()
                or search_query in e["objet_concerne"].lower()
                or search_query in e["type_action"].lower()
            ]

        return Response(audit_entries[:limit], status=status.HTTP_200_OK)


