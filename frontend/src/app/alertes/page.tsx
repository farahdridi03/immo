"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  CheckCheck,
  Filter,
  Wrench,
  MapPin,
  TrendingDown,
  Clock,
  ExternalLink,
  Loader2,
  ShieldAlert,
  Settings,
  Check,
} from "lucide-react";
import { alertesApi } from "@/services/api/maintenance";
import { entreprisesApi } from "@/services/api/users";
import { useAuth } from "@/context/AuthContext";
import { useRealtimeAlerts } from "@/hooks/useRealtimeAlerts";
import type { Alerte, Entreprise } from "@/types/api";

function formatRelativeTime(dateString: string): string {
  if (!dateString) return "";
  const now = new Date();
  const date = new Date(dateString);
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return "À l'instant";
  if (diffInSeconds < 3600) return `Il y a ${Math.floor(diffInSeconds / 60)} min`;
  if (diffInSeconds < 86400) return `Il y a ${Math.floor(diffInSeconds / 3600)} h`;
  if (diffInSeconds < 172800) return "Hier";
  const days = Math.floor(diffInSeconds / 86400);
  if (days < 30) return `Il y a ${days} jours`;
  return date.toLocaleDateString("fr-FR");
}

function getAlertIcon(typeAlerte: string) {
  switch (typeAlerte) {
    case "expiration_contrat":
      return <Clock className="w-5 h-5 text-amber-600" />;
    case "mouvement":
      return <MapPin className="w-5 h-5 text-blue-600" />;
    case "amortissement":
      return <TrendingDown className="w-5 h-5 text-purple-600" />;
    case "maintenance":
      return <Wrench className="w-5 h-5 text-orange-600" />;
    default:
      return <Bell className="w-5 h-5 text-[#78716C]" />;
  }
}

export default function AlertesPage() {
  const router = useRouter();
  const { user, hasAnyPermission } = useAuth();

  const [alertes, setAlertes] = useState<Alerte[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatut, setFilterStatut] = useState<"toutes" | "non_lu">("toutes");
  const [filterType, setFilterType] = useState<string>("tous");
  const [markingAll, setMarkingAll] = useState(false);

  // Settings State for Admin
  const [entreprise, setEntreprise] = useState<Entreprise | null>(null);
  const [delaiAlerte, setDelaiAlerte] = useState<number>(15);
  const [destinataires, setDestinataires] = useState<string>("responsables_et_admin");
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsSuccess, setSettingsSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<"liste" | "parametres">("liste");

  const isAdmin = user?.is_superuser || user?.est_admin_entreprise;

  // Real-time WebSocket listener
  useRealtimeAlerts({
    onAlertReceived: React.useCallback(
      (newAlert: Alerte) => {
        const link = newAlert.lien_cible || "";
        const type = newAlert.type_alerte;

        if (type === "expiration_contrat" || type === "maintenance" || link.includes("/maintenance")) {
          if (!hasAnyPermission(["P5", "maintenance", "view_maintenance", "gerer_maintenance"])) return;
        } else if (type === "mouvement" || link.includes("/immobilisations") || link.includes("/emplacements")) {
          if (!hasAnyPermission(["P1", "P2", "P3", "familles", "immobilisations", "emplacements"])) return;
        } else if (type === "amortissement" || link.includes("/amortissements")) {
          if (!hasAnyPermission(["P4", "amortissements", "view_amortissements"])) return;
        }

        setAlertes((prev) => [newAlert, ...prev.filter((a) => a.id !== newAlert.id)]);
      },
      [hasAnyPermission]
    ),
  });

  const fetchAlertes = async () => {
    setLoading(true);
    try {
      const data = await alertesApi.list();
      setAlertes(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Erreur chargement alertes:", err);
      setAlertes([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchEntreprise = async () => {
    if (user?.entreprise) {
      try {
        const ent = await entreprisesApi.get(user.entreprise);
        if (ent) {
          setEntreprise(ent);
          setDelaiAlerte(ent.delai_alerte_expiration_jours || 15);
          setDestinataires(ent.destinataires_alertes || "responsables_et_admin");
        }
      } catch (err) {
        console.error("Erreur chargement entreprise:", err);
      }
    }
  };

  useEffect(() => {
    fetchAlertes();
    fetchEntreprise();
  }, [user]);

  const handleMarkAsRead = async (alerte: Alerte, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (alerte.statut_lecture === "lu") return;

    try {
      await alertesApi.marquerLu(alerte.id);
      setAlertes((prev) =>
        prev.map((item) =>
          item.id === alerte.id ? { ...item, statut_lecture: "lu" } : item
        )
      );
    } catch (err) {
      console.error("Erreur marquage alerte lue:", err);
    }
  };

  const handleMarkAllAsRead = async () => {
    setMarkingAll(true);
    try {
      await alertesApi.marquerToutLu();
      setAlertes((prev) => prev.map((item) => ({ ...item, statut_lecture: "lu" })));
    } catch (err) {
      console.error("Erreur marquer tout lu:", err);
    } finally {
      setMarkingAll(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.entreprise) return;
    setSavingSettings(true);
    setSettingsSuccess(false);

    try {
      await entreprisesApi.update(user.entreprise, {
        delai_alerte_expiration_jours: delaiAlerte,
        destinataires_alertes: destinataires as any,
      });
      setSettingsSuccess(true);
      setTimeout(() => setSettingsSuccess(false), 3000);
      fetchAlertes();
    } catch (err) {
      console.error("Erreur enregistrement paramètres alertes:", err);
    } finally {
      setSavingSettings(false);
    }
  };

  const filteredAlertes = alertes.filter((alerte) => {
    if (filterStatut === "non_lu" && alerte.statut_lecture !== "non_lu") {
      return false;
    }
    if (filterType !== "tous" && alerte.type_alerte !== filterType) {
      return false;
    }
    return true;
  });

  const unreadCount = alertes.filter((a) => a.statut_lecture === "non_lu").length;

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E0DACB] pb-5">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#FAF8F2] border border-[#E0DACB] rounded-2xl shadow-2xs">
              <Bell className="w-6 h-6 text-[#1C1917]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[#1C1917] tracking-tight">
                Centre d'Alertes
              </h1>
              <p className="text-xs text-[#78716C] mt-0.5">
                Gérez vos notifications de contrats, mouvements d'emplacement et amortissements
              </p>
            </div>
          </div>
        </div>

        {/* Action buttons & tabs */}
        <div className="flex items-center gap-2">
          {isAdmin && (
            <div className="flex bg-[#EFECE6] p-1 rounded-xl">
              <button
                onClick={() => setActiveTab("liste")}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  activeTab === "liste"
                    ? "bg-white text-[#1C1917] shadow-2xs"
                    : "text-[#78716C] hover:text-[#1C1917]"
                }`}
              >
                Alertes
              </button>
              <button
                onClick={() => setActiveTab("parametres")}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
                  activeTab === "parametres"
                    ? "bg-white text-[#1C1917] shadow-2xs"
                    : "text-[#78716C] hover:text-[#1C1917]"
                }`}
              >
                <Settings className="w-3.5 h-3.5" />
                <span>Paramètres</span>
              </button>
            </div>
          )}

          {activeTab === "liste" && unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              disabled={markingAll}
              className="flex items-center gap-2 px-3.5 py-2 bg-[#FAF8F2] hover:bg-[#EFECE6] border border-[#E0DACB] text-[#1C1917] text-xs font-semibold rounded-xl transition-all shadow-2xs cursor-pointer disabled:opacity-50"
            >
              {markingAll ? (
                <Loader2 className="w-4 h-4 animate-spin text-[#1C1917]" />
              ) : (
                <CheckCheck className="w-4 h-4 text-emerald-600" />
              )}
              <span>Tout marquer comme lu</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Tab: Alert List */}
      {activeTab === "liste" && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#FAF8F2] border border-[#E0DACB] p-3 rounded-2xl shadow-2xs">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-[#78716C] ml-1" />
              <div className="flex bg-[#EFECE6] p-1 rounded-xl">
                <button
                  onClick={() => setFilterStatut("toutes")}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                    filterStatut === "toutes"
                      ? "bg-white text-[#1C1917] shadow-2xs"
                      : "text-[#78716C] hover:text-[#1C1917]"
                  }`}
                >
                  Toutes ({alertes.length})
                </button>
                <button
                  onClick={() => setFilterStatut("non_lu")}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
                    filterStatut === "non_lu"
                      ? "bg-white text-[#1C1917] shadow-2xs"
                      : "text-[#78716C] hover:text-[#1C1917]"
                  }`}
                >
                  <span>Non lues</span>
                  {unreadCount > 0 && (
                    <span className="h-4 w-4 rounded-full bg-[#DC2626] text-white text-[10px] font-bold flex items-center justify-center">
                      {unreadCount}
                    </span>
                  )}
                </button>
              </div>
            </div>

            {/* Type selector */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-[#78716C] font-medium hidden md:inline">
                Type :
              </span>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="bg-white border border-[#E0DACB] text-xs text-[#1C1917] font-medium rounded-xl px-3 py-1.5 outline-none focus:border-[#1C1917] transition-all cursor-pointer"
              >
                <option value="tous">Tous les types</option>
                <option value="expiration_contrat">Expiration de contrat</option>
                <option value="mouvement">Mouvement d'emplacement</option>
                <option value="amortissement">Amortissement</option>
                <option value="maintenance">Intervention maintenance</option>
                <option value="autre">Autre</option>
              </select>
            </div>
          </div>

          {/* List of Alerts */}
          {loading ? (
            <div className="flex items-center justify-center py-16 bg-white border border-[#E0DACB] rounded-2xl">
              <Loader2 className="w-6 h-6 animate-spin text-[#1C1917] mr-2" />
              <span className="text-xs text-[#78716C] font-medium">Chargement des alertes...</span>
            </div>
          ) : filteredAlertes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 bg-white border border-[#E0DACB] rounded-2xl text-center p-6 space-y-3">
              <div className="p-4 bg-[#FAF8F2] border border-[#E0DACB] rounded-full">
                <Bell className="w-8 h-8 text-[#A8A29E]" />
              </div>
              <h3 className="text-sm font-bold text-[#1C1917]">Aucune alerte trouvée</h3>
              <p className="text-xs text-[#78716C] max-w-sm">
                Vous n'avez aucune alerte correspondant aux filtres choisis pour le moment.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {filteredAlertes.map((alerte) => {
                const isUnread = alerte.statut_lecture === "non_lu";
                const targetLink = alerte.lien_cible || (alerte.contrat ? "/maintenance" : alerte.immobilisation ? `/immobilisations/${alerte.immobilisation}` : null);

                return (
                  <div
                    key={alerte.id}
                    onClick={() => {
                      handleMarkAsRead(alerte);
                      if (targetLink) router.push(targetLink);
                    }}
                    className={`group relative flex items-start justify-between p-4 rounded-2xl border transition-all cursor-pointer ${
                      isUnread
                        ? "bg-white border-[#E0DACB] shadow-sm hover:border-[#1C1917] hover:shadow-md"
                        : "bg-[#FAF8F2]/60 border-[#EFECE6] hover:bg-white hover:border-[#E0DACB]"
                    }`}
                  >
                    {/* Left: Icon & Content */}
                    <div className="flex items-start gap-3.5 min-w-0 pr-4">
                      {/* Unread indicator dot */}
                      <div className="pt-1.5 shrink-0 flex items-center justify-center">
                        {isUnread ? (
                          <span className="relative flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#DC2626] opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-[#DC2626]"></span>
                          </span>
                        ) : (
                          <div className="h-3 w-3 rounded-full bg-[#E0DACB]" />
                        )}
                      </div>

                      {/* Alert Icon */}
                      <div className="p-2 bg-[#FAF8F2] border border-[#E0DACB] rounded-xl shrink-0">
                        {getAlertIcon(alerte.type_alerte)}
                      </div>

                      {/* Alert Info */}
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-bold text-[#1C1917]">
                            {alerte.type_alerte_display || "Alerte Systèmes"}
                          </span>
                          {alerte.contrat_reference && (
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-[#FAF8F2] border border-[#E0DACB] text-[#57534E]">
                              Ref: {alerte.contrat_reference}
                            </span>
                          )}
                          {alerte.immobilisation_code && (
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-blue-50 border border-blue-200 text-blue-800">
                              Immo: {alerte.immobilisation_code}
                            </span>
                          )}
                        </div>

                        <p className={`text-xs ${isUnread ? "font-semibold text-[#1C1917]" : "text-[#57534E]"}`}>
                          {alerte.message}
                        </p>

                        <div className="text-[11px] text-[#A8A29E] font-medium pt-0.5">
                          {formatRelativeTime(alerte.date_alerte)}
                        </div>
                      </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-2 shrink-0 pt-1">
                      {targetLink && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMarkAsRead(alerte);
                            router.push(targetLink);
                          }}
                          title="Voir"
                          className="p-1.5 rounded-xl border border-[#E0DACB] bg-white hover:bg-[#1C1917] hover:text-white text-[#1C1917] transition-all shadow-2xs"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </button>
                      )}

                      {isUnread && (
                        <button
                          onClick={(e) => handleMarkAsRead(alerte, e)}
                          title="Marquer comme lu"
                          className="p-1.5 rounded-xl border border-[#E0DACB] bg-white hover:bg-[#EFECE6] text-[#78716C] hover:text-[#1C1917] transition-all"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Admin Tab: Alert Parameters */}
      {activeTab === "parametres" && isAdmin && (
        <form onSubmit={handleSaveSettings} className="bg-white border border-[#E0DACB] rounded-2xl p-6 shadow-sm space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-[#F0EBE1]">
            <div className="p-2.5 bg-[#FAF8F2] border border-[#E0DACB] rounded-2xl">
              <ShieldAlert className="w-5 h-5 text-[#1C1917]" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#1C1917]">
                Configuration des Alertes d'Entreprise
              </h2>
              <p className="text-xs text-[#78716C]">
                Définissez le comportement global des notifications et échéances de contrat
              </p>
            </div>
          </div>

          {settingsSuccess && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-semibold text-emerald-800 flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-700" />
              <span>Paramètres d'alerte sauvegardés avec succès !</span>
            </div>
          )}

          <div className="space-y-4">
            {/* Delay before expiration */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#1C1917]">
                Délai d'alerte avant expiration (en jours)
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min={1}
                  max={90}
                  value={delaiAlerte}
                  onChange={(e) => setDelaiAlerte(Number(e.target.value))}
                  className="w-32 bg-[#FAF8F2] border border-[#E0DACB] text-xs font-semibold text-[#1C1917] rounded-xl px-3.5 py-2.5 outline-none focus:border-[#1C1917] transition-all"
                  required
                />
                <span className="text-xs text-[#78716C]">
                  jours avant la date de fin du contrat de maintenance
                </span>
              </div>
              <p className="text-[11px] text-[#A8A29E]">
                Une alerte automatique sera créée et diffusée pour tout contrat arrivant à cette échéance.
              </p>
            </div>

            {/* Recipients */}
            <div className="space-y-1.5 pt-2">
              <label className="text-xs font-bold text-[#1C1917]">
                Qui reçoit les alertes de maintenance ?
              </label>
              <select
                value={destinataires}
                onChange={(e) => setDestinataires(e.target.value)}
                className="w-full sm:w-96 bg-[#FAF8F2] border border-[#E0DACB] text-xs font-semibold text-[#1C1917] rounded-xl px-3.5 py-2.5 outline-none focus:border-[#1C1917] transition-all cursor-pointer"
              >
                <option value="admin_uniquement">Administrateurs de l'entreprise uniquement</option>
                <option value="responsables_et_admin">Administrateurs et responsables de contrat</option>
                <option value="tous">Tous les utilisateurs actifs</option>
              </select>
            </div>
          </div>

          <div className="pt-4 border-t border-[#F0EBE1] flex justify-end">
            <button
              type="submit"
              disabled={savingSettings}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#1C1917] hover:bg-[#332E2B] text-white text-xs font-semibold rounded-xl transition-all shadow-sm cursor-pointer disabled:opacity-50"
            >
              {savingSettings ? (
                <Loader2 className="w-4 h-4 animate-spin text-white" />
              ) : (
                <Check className="w-4 h-4 text-white" />
              )}
              <span>Enregistrer la configuration</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
