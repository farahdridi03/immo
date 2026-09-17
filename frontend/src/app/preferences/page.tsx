"use client";

import React, { useState, useEffect } from "react";
import {
  Settings,
  Bell,
  Monitor,
  Globe,
  SunMoon,
  Coins,
  ListFilter,
  Check,
  Loader2,
  Mail,
  Sliders,
} from "lucide-react";
import { preferencesApi } from "@/services/api/users";
import { useAuth } from "@/context/AuthContext";
import type { UserPreference } from "@/types/api";

export default function PreferencesPage() {
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  // Preference State
  const [preferences, setPreferences] = useState<UserPreference>({
    id: 0,
    notif_email_contrats: true,
    notif_email_mouvements: true,
    notif_email_amortissements: true,
    notif_email_interventions: true,
    notif_inapp_enabled: true,
    langue: "fr",
    theme: "clair",
    devise: "TND",
    items_par_page: 10,
  });

  useEffect(() => {
    const fetchPrefs = async () => {
      setLoading(true);
      try {
        const data = await preferencesApi.get();
        if (data) {
          setPreferences(data);
        }
      } catch (err) {
        console.error("Erreur récuperation préférences:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchPrefs();
  }, []);

  const handleToggle = (key: keyof UserPreference) => {
    setPreferences((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSelectChange = (
    key: keyof UserPreference,
    value: string | number
  ) => {
    setPreferences((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccess(false);

    try {
      const updated = await preferencesApi.update(preferences);
      if (updated) {
        setPreferences(updated);
      }
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error("Erreur enregistrement préférences:", err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-[#1C1917]" />
        <span className="text-xs text-[#78716C] font-semibold ml-3">
          Chargement de vos préférences...
        </span>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E0DACB] pb-5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-[#FAF8F2] border border-[#E0DACB] rounded-2xl shadow-2xs">
            <Settings className="w-6 h-6 text-[#1C1917]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#1C1917] tracking-tight">
              Préférences d'utilisation
            </h1>
            <p className="text-xs text-[#78716C] mt-0.5">
              Personnalisez l'affichage, les devises et vos canaux de notifications
            </p>
          </div>
        </div>

        <button
          onClick={handleSubmit}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#1C1917] hover:bg-[#332E2B] text-white text-xs font-semibold rounded-xl transition-all shadow-sm cursor-pointer disabled:opacity-50 self-start sm:self-auto"
        >
          {saving ? (
            <Loader2 className="w-4 h-4 animate-spin text-white" />
          ) : (
            <Check className="w-4 h-4 text-white" />
          )}
          <span>Enregistrer les modifications</span>
        </button>
      </div>

      {success && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs font-semibold text-emerald-800 flex items-center gap-2.5 shadow-2xs animate-in fade-in duration-200">
          <Check className="w-4 h-4 text-emerald-700 shrink-0" />
          <span>Vos préférences ont été enregistrées avec succès !</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Notifications */}
        <div className="bg-white border border-[#E0DACB] rounded-2xl p-6 shadow-2xs space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-[#F0EBE1]">
            <div className="p-2 bg-[#FAF8F2] border border-[#E0DACB] rounded-xl">
              <Bell className="w-5 h-5 text-[#1C1917]" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#1C1917]">
                Notifications & Alertes
              </h2>
              <p className="text-xs text-[#78716C]">
                Gérez vos canaux et déclencheurs de notifications
              </p>
            </div>
          </div>

          {/* Global In-App toggle */}
          <div className="flex items-center justify-between p-4 bg-[#FAF8F2] border border-[#E0DACB] rounded-xl">
            <div className="flex items-center gap-3">
              <Bell className="w-4 h-4 text-[#1C1917]" />
              <div>
                <div className="text-xs font-bold text-[#1C1917]">
                  Notifications in-app (Cloche d'en-tête)
                </div>
                <div className="text-[11px] text-[#78716C]">
                  Recevez des alertes en direct directement sur la plateforme
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => handleToggle("notif_inapp_enabled")}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                preferences.notif_inapp_enabled ? "bg-[#1C1917]" : "bg-gray-300"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  preferences.notif_inapp_enabled ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {/* Email Notifications per Category */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-2 text-xs font-bold text-[#1C1917] mb-1">
              <Mail className="w-4 h-4 text-[#78716C]" />
              <span>Notifications par e-mail</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Contrats */}
              <label className="flex items-center justify-between p-3.5 border border-[#E0DACB] rounded-xl bg-white hover:bg-[#FAF8F2] transition-colors cursor-pointer">
                <div>
                  <div className="text-xs font-semibold text-[#1C1917]">
                    Alertes de contrats
                  </div>
                  <div className="text-[10px] text-[#78716C]">
                    Expirations et échéances de maintenance
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.notif_email_contrats}
                  onChange={() => handleToggle("notif_email_contrats")}
                  className="w-4 h-4 rounded border-[#E0DACB] text-[#1C1917] focus:ring-[#1C1917] cursor-pointer"
                />
              </label>

              {/* Mouvements */}
              <label className="flex items-center justify-between p-3.5 border border-[#E0DACB] rounded-xl bg-white hover:bg-[#FAF8F2] transition-colors cursor-pointer">
                <div>
                  <div className="text-xs font-semibold text-[#1C1917]">
                    Mouvements d'emplacement
                  </div>
                  <div className="text-[10px] text-[#78716C]">
                    Transferts et réaffectations de biens
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.notif_email_mouvements}
                  onChange={() => handleToggle("notif_email_mouvements")}
                  className="w-4 h-4 rounded border-[#E0DACB] text-[#1C1917] focus:ring-[#1C1917] cursor-pointer"
                />
              </label>

              {/* Amortissements */}
              <label className="flex items-center justify-between p-3.5 border border-[#E0DACB] rounded-xl bg-white hover:bg-[#FAF8F2] transition-colors cursor-pointer">
                <div>
                  <div className="text-xs font-semibold text-[#1C1917]">
                    Fin d'amortissement
                  </div>
                  <div className="text-[10px] text-[#78716C]">
                    Notification lorsque la VNC atteint la valeur résiduelle
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.notif_email_amortissements}
                  onChange={() => handleToggle("notif_email_amortissements")}
                  className="w-4 h-4 rounded border-[#E0DACB] text-[#1C1917] focus:ring-[#1C1917] cursor-pointer"
                />
              </label>

              {/* Interventions */}
              <label className="flex items-center justify-between p-3.5 border border-[#E0DACB] rounded-xl bg-white hover:bg-[#FAF8F2] transition-colors cursor-pointer">
                <div>
                  <div className="text-xs font-semibold text-[#1C1917]">
                    Interventions de maintenance
                  </div>
                  <div className="text-[10px] text-[#78716C]">
                    Suivi et réalisations d'interventions
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.notif_email_interventions}
                  onChange={() => handleToggle("notif_email_interventions")}
                  className="w-4 h-4 rounded border-[#E0DACB] text-[#1C1917] focus:ring-[#1C1917] cursor-pointer"
                />
              </label>
            </div>
          </div>
        </div>

        {/* Section 2: Affichage */}
        <div className="bg-white border border-[#E0DACB] rounded-2xl p-6 shadow-2xs space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-[#F0EBE1]">
            <div className="p-2 bg-[#FAF8F2] border border-[#E0DACB] rounded-xl">
              <Monitor className="w-5 h-5 text-[#1C1917]" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#1C1917]">
                Affichage & Régionalisation
              </h2>
              <p className="text-xs text-[#78716C]">
                Configurez la langue, la devise et le format des tableaux
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Langue */}
            <div className="space-y-1.5">
              <label className="flex items-center gap-2 text-xs font-bold text-[#1C1917]">
                <Globe className="w-3.5 h-3.5 text-[#78716C]" />
                <span>Langue de l'interface</span>
              </label>
              <select
                value={preferences.langue}
                onChange={(e) => handleSelectChange("langue", e.target.value)}
                className="w-full bg-[#FAF8F2] border border-[#E0DACB] text-xs font-semibold text-[#1C1917] rounded-xl px-3.5 py-2.5 outline-none focus:border-[#1C1917] transition-all cursor-pointer"
              >
                <option value="fr">Français (France)</option>
                <option value="ar">العربية (Arabe)</option>
              </select>
            </div>

            {/* Thème */}
            <div className="space-y-1.5">
              <label className="flex items-center gap-2 text-xs font-bold text-[#1C1917]">
                <SunMoon className="w-3.5 h-3.5 text-[#78716C]" />
                <span>Thème visuel</span>
              </label>
              <select
                value={preferences.theme}
                onChange={(e) => handleSelectChange("theme", e.target.value)}
                className="w-full bg-[#FAF8F2] border border-[#E0DACB] text-xs font-semibold text-[#1C1917] rounded-xl px-3.5 py-2.5 outline-none focus:border-[#1C1917] transition-all cursor-pointer"
              >
                <option value="clair">Mode Clair (Défaut)</option>
                <option value="sombre">Mode Sombre</option>
              </select>
            </div>

            {/* Devise */}
            <div className="space-y-1.5">
              <label className="flex items-center gap-2 text-xs font-bold text-[#1C1917]">
                <Coins className="w-3.5 h-3.5 text-[#78716C]" />
                <span>Devise d'affichage</span>
              </label>
              <select
                value={preferences.devise}
                onChange={(e) => handleSelectChange("devise", e.target.value)}
                className="w-full bg-[#FAF8F2] border border-[#E0DACB] text-xs font-semibold text-[#1C1917] rounded-xl px-3.5 py-2.5 outline-none focus:border-[#1C1917] transition-all cursor-pointer"
              >
                <option value="TND">Dinar Tunisien (TND - DT)</option>
                <option value="EUR">Euro (EUR - €)</option>
                <option value="USD">Dollar Américain (USD - $)</option>
              </select>
            </div>

            {/* Elements per page */}
            <div className="space-y-1.5">
              <label className="flex items-center gap-2 text-xs font-bold text-[#1C1917]">
                <ListFilter className="w-3.5 h-3.5 text-[#78716C]" />
                <span>Éléments par page dans les tableaux</span>
              </label>
              <select
                value={preferences.items_par_page}
                onChange={(e) =>
                  handleSelectChange("items_par_page", Number(e.target.value))
                }
                className="w-full bg-[#FAF8F2] border border-[#E0DACB] text-xs font-semibold text-[#1C1917] rounded-xl px-3.5 py-2.5 outline-none focus:border-[#1C1917] transition-all cursor-pointer"
              >
                <option value={10}>10 lignes par page</option>
                <option value={25}>25 lignes par page</option>
                <option value={50}>50 lignes par page</option>
              </select>
            </div>
          </div>
        </div>

        {/* Submit Bar Bottom */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-6 py-3 bg-[#1C1917] hover:bg-[#332E2B] text-white text-xs font-semibold rounded-xl transition-all shadow-md cursor-pointer disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin text-white" />
            ) : (
              <Check className="w-4 h-4 text-white" />
            )}
            <span>Enregistrer toutes les préférences</span>
          </button>
        </div>
      </form>
    </div>
  );
}
