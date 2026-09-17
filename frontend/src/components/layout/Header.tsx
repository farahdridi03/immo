"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, Bell, ChevronDown, Building2, User as UserIcon, Settings, LogOut, Check, Plus, Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { entreprisesApi } from "@/services/api/users";
import { alertesApi } from "@/services/api/maintenance";
import { useRealtimeAlerts } from "@/hooks/useRealtimeAlerts";
import type { Alerte, Entreprise } from "@/types/api";

export function Header() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCompanyMenuOpen, setIsCompanyMenuOpen] = useState(false);
  const [entreprises, setEntreprises] = useState<Entreprise[]>([]);
  const [selectedEntreprise, setSelectedEntreprise] = useState<Entreprise | null>(null);
  const [loadingEntreprises, setLoadingEntreprises] = useState(false);
  const [unreadCount, setUnreadCount] = useState<number>(0);

  const menuRef = useRef<HTMLDivElement>(null);
  const companyMenuRef = useRef<HTMLDivElement>(null);

  const companyName = selectedEntreprise?.nom || user?.entreprise_nom || "Groupe Almadia";
  const userName = user?.first_name && user?.last_name ? `${user.first_name} ${user.last_name}` : user?.username || "Karim Benali";
  const userRole = user?.role_nom || "Gestionnaire actifs";
  const initials = userName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase() || "KB";

  const [toastAlert, setToastAlert] = useState<Alerte | null>(null);

  // Real-time WebSocket Notifications
  useRealtimeAlerts({
    onAlertReceived: React.useCallback((newAlert: Alerte) => {
      setUnreadCount((prev) => prev + 1);
      setToastAlert(newAlert);

      // Auto-dismiss toast after 7 seconds
      setTimeout(() => {
        setToastAlert((current) => (current?.id === newAlert.id ? null : current));
      }, 7000);
    }, []),
  });

  // Fetch unread alert count
  useEffect(() => {
    if (user) {
      alertesApi
        .list({ statut_lecture: "non_lu" })
        .then((data) => {
          setUnreadCount(Array.isArray(data) ? data.length : 0);
        })
        .catch(() => setUnreadCount(0));
    }
  }, [user]);

  // Fetch user's enterprises
  useEffect(() => {
    if (user) {
      setLoadingEntreprises(true);
      entreprisesApi
        .list()
        .then((data) => {
          const list = Array.isArray(data) ? data : [];
          setEntreprises(list);
          if (user.entreprise_nom) {
            const matched = list.find((e) => e.nom === user.entreprise_nom || e.id === user.entreprise);
            if (matched) setSelectedEntreprise(matched);
          }
        })
        .catch(() => {
          setEntreprises([]);
        })
        .finally(() => {
          setLoadingEntreprises(false);
        });
    }
  }, [user]);

  // Close dropdowns on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
      if (companyMenuRef.current && !companyMenuRef.current.contains(event.target as Node)) {
        setIsCompanyMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleLogout = () => {
    setIsMenuOpen(false);
    logout();
    router.push("/login");
  };

  return (
    <header className="h-16 w-full border-b border-[#EFECE6] bg-[#F7F4EC] px-6 flex items-center justify-between sticky top-0 z-30">
      {/* Left: Entity Switcher */}
      <div className="relative flex items-center gap-3" ref={companyMenuRef}>
        <button
          onClick={() => setIsCompanyMenuOpen((prev) => !prev)}
          className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-xl border border-[#E0DACB] bg-[#FAF8F2] hover:bg-[#EFECE6] text-[#1C1917] text-xs font-medium shadow-2xs transition-colors cursor-pointer"
          aria-expanded={isCompanyMenuOpen}
          aria-haspopup="true"
        >
          <Building2 className="w-4 h-4 text-[#78716C]" />
          <span>{companyName}</span>
          <ChevronDown className="w-3.5 h-3.5 text-[#78716C] ml-1" />
        </button>

        {/* Company Switcher Dropdown Popover */}
        {isCompanyMenuOpen && (
          <div className="absolute left-0 top-full mt-2 w-72 bg-white rounded-2xl border border-[#E0DACB] shadow-xl p-2 z-50 transition-all animate-in fade-in slide-in-from-top-2 duration-150">
            <div className="px-3.5 py-2 text-xs font-bold text-[#78716C] uppercase tracking-wider border-b border-[#F0EBE1] mb-1 flex items-center justify-between">
              <span>Entreprises disponibles</span>
              <span className="text-[10px] font-semibold bg-[#F5F2EB] text-[#57534E] px-2 py-0.5 rounded-full">
                {entreprises.length}
              </span>
            </div>

            <div className="max-h-56 overflow-y-auto space-y-1 py-1">
              {loadingEntreprises ? (
                <div className="flex items-center justify-center py-4 text-xs text-[#78716C] gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-[#1C1917]" />
                  <span>Chargement...</span>
                </div>
              ) : entreprises.length > 0 ? (
                entreprises.map((ent) => {
                  const isSelected = selectedEntreprise?.id === ent.id || (!selectedEntreprise && ent.nom === companyName);
                  return (
                    <button
                      key={ent.id}
                      onClick={() => {
                        setSelectedEntreprise(ent);
                        setIsCompanyMenuOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all text-left ${
                        isSelected
                          ? "bg-[#EAE3CE] text-[#1C1917] font-semibold"
                          : "text-[#44403C] hover:bg-[#F5F2EB] hover:text-[#1C1917]"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Building2 className={`w-4 h-4 shrink-0 ${isSelected ? "text-[#1C1917]" : "text-[#78716C]"}`} />
                        <div className="truncate">
                          <div className="truncate font-semibold">{ent.nom}</div>
                          {ent.secteur_activite && (
                            <div className="text-[10px] text-[#78716C] truncate">{ent.secteur_activite}</div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {ent.statut_validation === "approuve" && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Approuvé
                          </span>
                        )}
                        {ent.statut_validation === "en_attente" && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200">
                            En attente
                          </span>
                        )}
                        {ent.statut_validation === "rejete" && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-200">
                            Rejeté
                          </span>
                        )}
                        {isSelected && <Check className="w-3.5 h-3.5 text-[#1C1917]" />}
                      </div>
                    </button>
                  );
                })
              ) : (
                <div className="px-3.5 py-3 text-xs text-[#78716C] text-center">
                  Aucune entreprise trouvée.
                </div>
              )}
            </div>

            <div className="mt-1 pt-1.5 border-t border-[#F0EBE1]">
              <button
                onClick={() => {
                  setIsCompanyMenuOpen(false);
                  router.push("/inscription");
                }}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold text-[#1C1917] hover:bg-[#F5F2EB] rounded-xl transition-colors"
              >
                <Plus className="w-3.5 h-3.5 text-[#1C1917]" />
                <span>Ajouter une entreprise</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Right Section: Search + Notifications + User */}
      <div className="flex items-center gap-5">
        {/* Search Input */}
        <div className="relative w-64 sm:w-80">
          <Search className="w-4 h-4 text-[#A8A29E] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Rechercher un bien, un code..."
            className="w-full bg-[#FAF8F2] border border-[#E0DACB] text-xs text-[#1C1917] placeholder:text-[#A8A29E] rounded-xl pl-9 pr-3 py-2 outline-none focus:border-[#1C1917] focus:ring-1 focus:ring-[#1C1917] transition-all"
          />
        </div>

        {/* Bell Notifications */}
        <button
          onClick={() => router.push("/alertes")}
          className="relative p-2 rounded-xl text-[#57534E] hover:bg-[#EFECE6] transition-colors cursor-pointer"
          title="Centre d'Alertes"
        >
          <Bell className="w-4 h-4 text-[#78716C]" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 h-4 w-4 rounded-full bg-[#DC2626] text-white text-[10px] font-bold flex items-center justify-center shadow-xs">
              {unreadCount}
            </span>
          )}
        </button>

        {/* User Profile Dropdown Trigger & Popover */}
        <div className="relative pl-2 border-l border-[#E0DACB]" ref={menuRef}>
          <button
            onClick={() => setIsMenuOpen((prev) => !prev)}
            className="flex items-center gap-2.5 p-1 rounded-xl hover:bg-[#EFECE6]/80 transition-all text-left group"
            aria-expanded={isMenuOpen}
            aria-haspopup="true"
          >
            <div className="h-9 w-9 rounded-full bg-[#1C1917] text-white font-bold text-xs flex items-center justify-center shadow-xs shrink-0 group-hover:scale-105 transition-transform overflow-hidden">
              {user?.avatar ? (
                <img src={user.avatar} alt={userName} className="w-full h-full object-cover" />
              ) : (
                initials
              )}
            </div>
            <div className="text-left hidden sm:block leading-tight">
              <div className="text-xs font-bold text-[#1C1917] flex items-center gap-1">
                <span>{userName}</span>
              </div>
              <div className="text-[11px] text-[#78716C]">{userRole}</div>
            </div>
          </button>

          {/* User Popover Menu */}
          {isMenuOpen && (
            <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-2xl border border-[#E0DACB] shadow-xl p-2 z-50 transition-all animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="px-3.5 py-2 text-sm font-bold text-[#1C1917] border-b border-[#F0EBE1] mb-1">
                Mon compte
              </div>

              <div className="space-y-0.5">
                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    router.push("/profil");
                  }}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-[#44403C] hover:bg-[#F5F2EB] hover:text-[#1C1917] rounded-xl font-medium transition-colors text-left"
                >
                  <UserIcon className="w-4 h-4 text-[#78716C]" />
                  <span>Mon Profil</span>
                </button>

                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    router.push("/preferences");
                  }}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-[#44403C] hover:bg-[#F5F2EB] hover:text-[#1C1917] rounded-xl font-medium transition-colors text-left"
                >
                  <Settings className="w-4 h-4 text-[#78716C]" />
                  <span>Préférences</span>
                </button>
              </div>

              <div className="my-1.5 border-t border-[#F0EBE1]" />

              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-[#DC2626] hover:bg-red-50 rounded-xl font-medium transition-colors text-left"
              >
                <LogOut className="w-4 h-4 text-[#DC2626]" />
                <span>Se déconnecter</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Real-time WebSocket Alert Toast Notification */}
      {toastAlert && (
        <div className="fixed bottom-6 right-6 z-50 max-w-sm w-full bg-[#1C1917] text-white p-4 rounded-2xl shadow-2xl border border-stone-700 animate-in slide-in-from-bottom-5 duration-300 flex items-start gap-3">
          <div className="p-2.5 bg-amber-500/20 text-amber-400 rounded-xl shrink-0 mt-0.5">
            <Bell className="w-5 h-5 animate-pulse" />
          </div>
          <div className="flex-1 min-w-0 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                {toastAlert.type_alerte_display || "Nouvelle Alerte"}
              </span>
              <button
                onClick={() => setToastAlert(null)}
                className="text-stone-400 hover:text-white text-xs font-bold p-1 rounded-md"
              >
                ✕
              </button>
            </div>
            <p className="text-xs text-stone-200 line-clamp-2 leading-relaxed font-medium">
              {toastAlert.message}
            </p>
            <div className="pt-2 flex items-center justify-between border-t border-stone-800">
              <span className="text-[10px] text-stone-400 font-mono">En temps réel (WebSockets)</span>
              <button
                onClick={() => {
                  setToastAlert(null);
                  router.push(toastAlert.lien_cible || "/alertes");
                }}
                className="text-xs font-bold text-amber-400 hover:text-amber-300 underline"
              >
                Consulter →
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
