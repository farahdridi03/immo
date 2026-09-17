"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Layers,
  Calculator,
  CalendarClock,
  Bell,
  ArrowRight,
  Loader2,
  Building2,
  CheckCircle2,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import HomePage from "@/app/home/page";
import { immobilisationsApi, famillesApi } from "@/services/api/immobilisations";
import { contratsApi, alertesApi } from "@/services/api/maintenance";
import type { Immobilisation, Famille, ContratMaintenance, Alerte } from "@/types/api";

export default function RootPage() {
  const { user } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [hasToken, setHasToken] = useState(false);

  useEffect(() => {
    setMounted(true);
    setHasToken(!!localStorage.getItem("token"));
  }, [user]);

  if (!mounted) {
    return null;
  }

  const isAuth = !!user || hasToken;

  if (!isAuth) {
    return <HomePage />;
  }

  return <DashboardContent />;
}

function DashboardContent() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [immobilisations, setImmobilisations] = useState<Immobilisation[]>([]);
  const [familles, setFamilles] = useState<Famille[]>([]);
  const [contrats, setContrats] = useState<ContratMaintenance[]>([]);
  const [alertes, setAlertes] = useState<Alerte[]>([]);

  useEffect(() => {
    async function loadDashboardData() {
      setLoading(true);
      try {
        const [resImmos, resFamilles, resContrats, resAlertes] = await Promise.all([
          immobilisationsApi.list().catch(() => []),
          famillesApi.list().catch(() => []),
          contratsApi.list().catch(() => []),
          alertesApi.list().catch(() => []),
        ]);

        if (Array.isArray(resImmos)) setImmobilisations(resImmos);
        if (Array.isArray(resFamilles)) setFamilles(resFamilles);
        if (Array.isArray(resContrats)) setContrats(resContrats);
        if (Array.isArray(resAlertes)) setAlertes(resAlertes);
      } catch (err) {
        console.error("Error loading dashboard data:", err);
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, []);

  // Real Dynamic Calculations
  const totalImmosCount = immobilisations.length;
  const inServiceImmosCount = immobilisations.filter(
    (i) => i.statut === "en_service"
  ).length;

  const totalAcquisitionValue = immobilisations.reduce((acc, curr) => {
    const val =
      typeof curr.valeur_acquisition === "string"
        ? parseFloat(curr.valeur_acquisition)
        : Number(curr.valeur_acquisition) || 0;
    return acc + (isNaN(val) ? 0 : val);
  }, 0);

  const activeContratsCount = contrats.filter((c) => c.statut === "actif").length;

  const now = new Date();
  const thirtyDaysLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const expiringContratsCount = contrats.filter((c) => {
    if (!c.date_fin) return false;
    const endDate = new Date(c.date_fin);
    return endDate >= now && endDate <= thirtyDaysLater;
  }).length;

  const unreadAlerts = alertes.filter((a) => a.statut_lecture === "non_lu");
  const displayAlerts = alertes.length > 0 ? alertes.slice(0, 5) : [];

  // Real Family breakdown
  const familyStats = familles.map((fam) => {
    const famImmos = immobilisations.filter(
      (i) => i.famille === fam.id || i.famille_nom === fam.nom
    );
    const famTotal = famImmos.reduce((acc, curr) => {
      const val =
        typeof curr.valeur_acquisition === "string"
          ? parseFloat(curr.valeur_acquisition)
          : Number(curr.valeur_acquisition) || 0;
      return acc + (isNaN(val) ? 0 : val);
    }, 0);

    const percentage =
      totalAcquisitionValue > 0
        ? Math.round((famTotal / totalAcquisitionValue) * 100)
        : 0;

    return {
      id: fam.id,
      name: fam.nom,
      count: famImmos.length,
      amount: famTotal.toLocaleString("fr-FR", { minimumFractionDigits: 2 }) + " DT",
      percentage,
    };
  });

  const unassignedImmos = immobilisations.filter(
    (i) => !i.famille && !i.famille_nom
  );
  if (unassignedImmos.length > 0) {
    const unassignedTotal = unassignedImmos.reduce((acc, curr) => {
      const val =
        typeof curr.valeur_acquisition === "string"
          ? parseFloat(curr.valeur_acquisition)
          : Number(curr.valeur_acquisition) || 0;
      return acc + (isNaN(val) ? 0 : val);
    }, 0);
    const percentage =
      totalAcquisitionValue > 0
        ? Math.round((unassignedTotal / totalAcquisitionValue) * 100)
        : 0;
    familyStats.push({
      id: 0,
      name: "Non classé",
      count: unassignedImmos.length,
      amount: unassignedTotal.toLocaleString("fr-FR", { minimumFractionDigits: 2 }) + " DT",
      percentage,
    });
  }

  const currentDateFormatted = new Date().toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const entrepriseName = user?.entreprise_nom
    ? user.entreprise_nom
    : user?.first_name || user?.username || "GestImmo";

  if (loading) {
    return (
      <div className="py-20 text-center space-y-3">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#1C1917]" />
        <p className="text-xs text-[#78716C] font-medium">
          Chargement des données du tableau de bord...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-1.5 text-xs text-[#8C857B] font-medium">
        <span>Accueil</span>
        <span>/</span>
        <span className="text-[#1C1917]">Tableau de bord</span>
      </div>

      {/* Page Title & Main Action Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#1C1917] tracking-tight">
            Tableau de bord
          </h1>
          <p className="text-xs sm:text-sm text-[#78716C] mt-1 font-normal">
            Situation du parc au {currentDateFormatted} — {entrepriseName}
          </p>
        </div>

        <Link
          href="/immobilisations"
          className="inline-flex items-center justify-center gap-2 bg-[#2A2725] hover:bg-[#1C1917] text-white text-xs sm:text-sm font-medium px-4 py-2.5 rounded-xl shadow-xs transition-all w-fit"
        >
          <span>Voir les immobilisations</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Top 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Immobilisations */}
        <div className="bg-white border border-[#EFECE6] rounded-2xl p-5 shadow-2xs space-y-3 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#78716C]">
              Immobilisations
            </span>
            <Layers className="w-4 h-4 text-[#A8A29E]" />
          </div>
          <div className="text-3xl font-bold text-[#1C1917] tracking-tight">
            {totalImmosCount}
          </div>
          <div>
            <span className="inline-flex items-center gap-1 bg-[#E8F0FE] text-[#2563EB] text-[11px] font-semibold px-2.5 py-1 rounded-full">
              {inServiceImmosCount} en service
            </span>
          </div>
        </div>

        {/* Card 2: Valeur d'acquisition totale */}
        <div className="bg-white border border-[#EFECE6] rounded-2xl p-5 shadow-2xs space-y-3 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#78716C]">
              Valeur d'acquisition totale
            </span>
            <Calculator className="w-4 h-4 text-[#A8A29E]" />
          </div>
          <div className="text-2xl font-bold text-[#1C1917] tracking-tight">
            {totalAcquisitionValue.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} DT
          </div>
          <div>
            <span className="inline-flex items-center gap-1.5 bg-[#E6F4EA] text-[#16A34A] text-[11px] font-semibold px-2.5 py-1 rounded-full">
              <span className="h-1.5 w-1.5 rounded-full bg-[#16A34A]" />
              Total des équipements
            </span>
          </div>
        </div>

        {/* Card 3: Contrats de maintenance */}
        <div className="bg-white border border-[#EFECE6] rounded-2xl p-5 shadow-2xs space-y-3 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#78716C]">
              Contrats de maintenance
            </span>
            <CalendarClock className="w-4 h-4 text-[#A8A29E]" />
          </div>
          <div className="text-3xl font-bold text-[#1C1917] tracking-tight">
            {contrats.length}
          </div>
          <div>
            <span className="inline-flex items-center gap-1.5 bg-[#FDF0E6] text-[#B45309] text-[11px] font-semibold px-2.5 py-1 rounded-full">
              <span className="h-1.5 w-1.5 rounded-full bg-[#B45309]" />
              {expiringContratsCount > 0
                ? `${expiringContratsCount} expirant dans < 30 j`
                : `${activeContratsCount} actif(s)`}
            </span>
          </div>
        </div>

        {/* Card 4: Alertes Système */}
        <div className="bg-white border border-[#EFECE6] rounded-2xl p-5 shadow-2xs space-y-3 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#78716C]">
              Alertes non lues
            </span>
            <Bell className="w-4 h-4 text-[#A8A29E]" />
          </div>
          <div className="text-3xl font-bold text-[#1C1917] tracking-tight">
            {unreadAlerts.length}
          </div>
          <div>
            <span className="inline-flex items-center gap-1.5 bg-[#FCE8E6] text-[#DC2626] text-[11px] font-semibold px-2.5 py-1 rounded-full">
              <span className="h-1.5 w-1.5 rounded-full bg-[#DC2626]" />
              {alertes.length} alerte(s) au total
            </span>
          </div>
        </div>
      </div>

      {/* Main Bottom Section: 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Column: Répartition par famille */}
        <div className="lg:col-span-2 bg-white border border-[#EFECE6] rounded-2xl p-6 shadow-2xs space-y-6">
          <div className="flex items-center justify-between pb-2">
            <h2 className="text-base font-bold text-[#1C1917]">
              Répartition par famille
            </h2>
            <span className="text-xs font-medium text-[#8C857B]">
              Valeur d'acquisition
            </span>
          </div>

          {familyStats.length === 0 ? (
            <div className="py-8 text-center text-xs text-[#78716C]">
              Aucune famille d'immobilisations enregistrée dans le système.
            </div>
          ) : (
            <div className="space-y-5">
              {familyStats.map((item) => (
                <div key={item.id || item.name} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-medium">
                    <span className="text-[#1C1917] font-semibold">
                      {item.name} ({item.count} équipement(s))
                    </span>
                    <span className="text-[#78716C] font-semibold">
                      {item.amount} ({item.percentage}%)
                    </span>
                  </div>
                  {/* Dynamic Progress Bar */}
                  <div className="w-full bg-[#F0EDE4] h-2.5 rounded-full overflow-hidden">
                    <div
                      className="bg-[#2A2725] h-full rounded-full transition-all duration-300"
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Dernières alertes */}
        <div className="lg:col-span-1 bg-white border border-[#EFECE6] rounded-2xl p-6 shadow-2xs space-y-5">
          <div className="flex items-center justify-between pb-1">
            <h2 className="text-base font-bold text-[#1C1917]">
              Dernières alertes
            </h2>
            <Link
              href="/alertes"
              className="text-xs font-medium text-[#78716C] hover:text-[#1C1917] transition-colors"
            >
              Tout voir
            </Link>
          </div>

          {displayAlerts.length === 0 ? (
            <div className="py-8 text-center text-xs text-[#78716C] space-y-2">
              <CheckCircle2 className="w-6 h-6 mx-auto text-emerald-500" />
              <p>Aucune alerte enregistrée pour le moment.</p>
            </div>
          ) : (
            <div className="space-y-3.5">
              {displayAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className="bg-[#FAF8F2] border border-[#EFECE6] rounded-xl p-3.5 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 bg-[#FDF0E6] text-[#78350F] text-[11px] font-semibold px-2.5 py-0.5 rounded-full">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#B45309]" />
                      {alert.type_alerte || "Notification"}
                    </span>
                    <span className="text-[11px] text-[#8C857B] font-medium">
                      {alert.date_alerte
                        ? new Date(alert.date_alerte).toLocaleDateString("fr-FR")
                        : "Récent"}
                    </span>
                  </div>
                  <p className="text-xs text-[#1C1917] font-medium leading-relaxed">
                    {alert.message}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
