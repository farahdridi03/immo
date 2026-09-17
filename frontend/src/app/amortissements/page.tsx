"use client";

import React, { useEffect, useState } from "react";
import { PageContainer } from "@/components/layout/PageContainer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { amortissementsApi, immobilisationsApi } from "@/services/api/immobilisations";
import type { PlanAmortissement, EcritureAmortissement, Immobilisation, ModeAmortissement } from "@/types/api";
import { exportPlanAmortissementToExcel, exportAllPlansToExcel } from "@/lib/exportExcel";
import { FileSpreadsheet, Download } from "lucide-react";

export default function AmortissementsPage() {
  const [plans, setPlans] = useState<PlanAmortissement[]>([]);
  const [immobilisations, setImmobilisations] = useState<Immobilisation[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Plan Form Modal
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [selectedAssetId, setSelectedAssetId] = useState<string>("");
  const [valeurAcquisition, setValeurAcquisition] = useState<string>("");
  const [dateDebut, setDateDebut] = useState<string>("");
  const [duree, setDuree] = useState<number | string>(5);
  const [taux, setTaux] = useState<string>("20.00");
  const [mode, setMode] = useState<ModeAmortissement>("lineaire");
  const [valeurResiduelle, setValeurResiduelle] = useState<string>("0.00");

  // Schedule Detail Drawer/Modal
  const [selectedPlan, setSelectedPlan] = useState<PlanAmortissement | null>(null);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [recalculating, setRecalculating] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [plansData, immosData] = await Promise.all([
        amortissementsApi.listPlans(search ? { search } : undefined),
        immobilisationsApi.list(),
      ]);
      if (Array.isArray(plansData)) setPlans(plansData);
      if (Array.isArray(immosData)) setImmobilisations(immosData);
    } catch (err) {
      console.error("Erreur lors du chargement des amortissements", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [search]);

  // Handle asset selection in form to auto-fill default acquisition value & date
  const handleAssetChange = (assetIdStr: string) => {
    setSelectedAssetId(assetIdStr);
    const asset = immobilisations.find((i) => i.id === Number(assetIdStr));
    if (asset) {
      if (asset.valeur_acquisition) {
        setValeurAcquisition(String(asset.valeur_acquisition));
      }
      if (asset.date_mise_en_service || asset.date_acquisition) {
        setDateDebut(String(asset.date_mise_en_service || asset.date_acquisition));
      } else {
        setDateDebut(new Date().toISOString().split("T")[0]);
      }
    }
  };

  // Handle duration change to auto calculate standard linear rate
  const handleDureeChange = (val: string) => {
    setDuree(val);
    const num = Number(val);
    if (num > 0) {
      setTaux((100 / num).toFixed(2));
    }
  };

  const handleOpenCreate = () => {
    setEditingId(null);
    setSelectedAssetId("");
    setValeurAcquisition("");
    setDateDebut(new Date().toISOString().split("T")[0]);
    setDuree(5);
    setTaux("20.00");
    setMode("lineaire");
    setValeurResiduelle("0.00");
    setIsFormModalOpen(true);
  };

  const handleOpenEdit = (plan: PlanAmortissement) => {
    setEditingId(plan.id);
    setSelectedAssetId(String(plan.immobilisation));
    setValeurAcquisition(String(plan.valeur_acquisition));
    setDateDebut(plan.date_debut_amortissement);
    setDuree(plan.duree_amortissement);
    setTaux(String(plan.taux_amortissement));
    setMode(plan.mode_amortissement);
    setValeurResiduelle(String(plan.valeur_residuelle));
    setIsFormModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssetId) {
      alert("Veuillez sélectionner une immobilisation.");
      return;
    }

    try {
      const payload: Partial<PlanAmortissement> = {
        immobilisation: Number(selectedAssetId),
        valeur_acquisition: valeurAcquisition,
        date_debut_amortissement: dateDebut,
        duree_amortissement: Number(duree),
        taux_amortissement: taux,
        mode_amortissement: mode,
        valeur_residuelle: valeurResiduelle,
      };

      if (editingId) {
        await amortissementsApi.updatePlan(editingId, payload);
      } else {
        await amortissementsApi.createPlan(payload);
      }

      setIsFormModalOpen(false);
      loadData();
    } catch (err: any) {
      alert("Erreur lors de l'enregistrement du plan d'amortissement.");
    }
  };

  const handleDeletePlan = async (id: number) => {
    if (confirm("Voulez-vous vraiment supprimer ce plan d'amortissement ?")) {
      try {
        await amortissementsApi.deletePlan(id);
        if (selectedPlan?.id === id) {
          setIsScheduleModalOpen(false);
          setSelectedPlan(null);
        }
        loadData();
      } catch (err) {
        alert("Impossible de supprimer le plan.");
      }
    }
  };

  const handleViewSchedule = async (plan: PlanAmortissement) => {
    try {
      const detail = await amortissementsApi.getPlan(plan.id);
      setSelectedPlan(detail);
      setIsScheduleModalOpen(true);
    } catch (err) {
      setSelectedPlan(plan);
      setIsScheduleModalOpen(true);
    }
  };

  const handleRecalculateSchedule = async (planId: number) => {
    setRecalculating(true);
    try {
      const updated = await amortissementsApi.recalculerPlan(planId);
      setSelectedPlan(updated);
      loadData();
    } catch (err) {
      alert("Erreur lors du calcul du tableau d'amortissement.");
    } finally {
      setRecalculating(false);
    }
  };

  // KPIs
  const totalPlans = plans.length;
  const totalValAcq = plans.reduce(
    (sum, p) => sum + Number(p.valeur_acquisition || 0),
    0
  );
  const totalCumul = plans.reduce((sum, p) => {
    const lastEcriture = p.ecritures && p.ecritures.length > 0 ? p.ecritures[p.ecritures.length - 1] : null;
    return sum + (lastEcriture ? Number(lastEcriture.amortissement_cumule || 0) : 0);
  }, 0);
  const totalVNC = plans.reduce((sum, p) => {
    const lastEcriture = p.ecritures && p.ecritures.length > 0 ? p.ecritures[p.ecritures.length - 1] : null;
    return sum + (lastEcriture ? Number(lastEcriture.valeur_nette_comptable || p.valeur_acquisition) : Number(p.valeur_acquisition || 0));
  }, 0);

  return (
    <PageContainer>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Plans d'Amortissement</h1>
            <p className="text-muted-foreground">
              Gestion des tableaux d'amortissement comptables et fiscaux (Linéaire / Dégressif).
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              onClick={() => exportAllPlansToExcel(plans)}
              disabled={plans.length === 0}
              title="Exporter tous les plans d'amortissement en Excel"
              className="shadow-sm"
            >
              <FileSpreadsheet className="w-4 h-4 mr-2 text-emerald-600" />
              Exporter Tout (Excel)
            </Button>
            <Button onClick={handleOpenCreate} className="shadow-md">
              + Nouveau Plan d'Amortissement
            </Button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">
                Total Plans
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalPlans}</div>
              <p className="text-xs text-muted-foreground mt-1">Actifs au répertoire</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">
                Valeur d'Acquisition Totale
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">
                {totalValAcq.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} DT
              </div>
              <p className="text-xs text-muted-foreground mt-1">Base amortissable</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">
                Amortissement Cumulé
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                {totalCumul.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} DT
              </div>
              <p className="text-xs text-muted-foreground mt-1">Total déprécié</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">
                Valeur Nette Comptable (VNC)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                {totalVNC.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} DT
              </div>
              <p className="text-xs text-muted-foreground mt-1">Valeur nette résiduelle</p>
            </CardContent>
          </Card>
        </div>

        {/* Filter Input */}
        <div className="flex items-center gap-4">
          <Input
            placeholder="Rechercher par immobilisation..."
            value={search}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
            className="max-w-xs"
          />
        </div>

        {/* Plans Table */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-medium">
              Liste des Plans d'Amortissement ({plans.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="py-8 text-center text-muted-foreground">Chargement en cours...</div>
            ) : plans.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
                Aucun plan d'amortissement enregistré.
              </div>
            ) : (
              <div className="relative overflow-x-auto">
                <table className="w-full text-sm text-left border-collapse">
                  <thead className="bg-muted/50 text-muted-foreground uppercase text-xs">
                    <tr>
                      <th className="px-4 py-3">Code & Désignation</th>
                      <th className="px-4 py-3">Mode</th>
                      <th className="px-4 py-3">Date Début</th>
                      <th className="px-4 py-3">Durée & Taux</th>
                      <th className="px-4 py-3">Val. Acquisition</th>
                      <th className="px-4 py-3">VNC Actuelle</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {plans.map((item) => {
                      const lastEcriture =
                        item.ecritures && item.ecritures.length > 0
                          ? item.ecritures[item.ecritures.length - 1]
                          : null;
                      const currentVnc = lastEcriture
                        ? Number(lastEcriture.valeur_nette_comptable)
                        : Number(item.valeur_acquisition);

                      return (
                        <tr key={item.id} className="hover:bg-muted/20">
                          <td className="px-4 py-3">
                            <div className="font-semibold text-foreground">
                              {item.immobilisation_designation || `Immobilisation #${item.immobilisation}`}
                            </div>
                            <div className="font-mono text-xs text-muted-foreground">
                              {item.immobilisation_code}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant={item.mode_amortissement === "lineaire" ? "outline" : "secondary"}>
                              {item.mode_amortissement_display || item.mode_amortissement}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">
                            {item.date_debut_amortissement}
                          </td>
                          <td className="px-4 py-3">
                            <div className="font-medium">{item.duree_amortissement} ans</div>
                            <div className="text-xs text-muted-foreground">
                              Taux: {Number(item.taux_amortissement).toFixed(2)}%
                            </div>
                          </td>
                          <td className="px-4 py-3 font-semibold">
                            {Number(item.valeur_acquisition).toLocaleString("fr-FR", {
                              minimumFractionDigits: 2,
                            })}{" "}
                            DT
                          </td>
                          <td className="px-4 py-3 font-bold text-emerald-600 dark:text-emerald-400">
                            {currentVnc.toLocaleString("fr-FR", {
                              minimumFractionDigits: 2,
                            })}{" "}
                            DT
                          </td>
                          <td className="px-4 py-3 text-right space-x-2">
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => handleViewSchedule(item)}
                              title="Voir le tableau d'amortissement"
                            >
                              Tableau
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => handleOpenEdit(item)}>
                              Éditer
                            </Button>
                            <Button size="sm" variant="destructive" onClick={() => handleDeletePlan(item.id)}>
                              Supprimer
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Form Modal (Create / Edit) */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-background rounded-lg shadow-xl w-full max-w-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold">
              {editingId ? "Modifier le Plan d'Amortissement" : "Nouveau Plan d'Amortissement"}
            </h2>

            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium">Immobilisation *</label>
                <select
                  className="w-full mt-1 flex h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  value={selectedAssetId}
                  onChange={(e) => handleAssetChange(e.target.value)}
                  required
                  disabled={!!editingId}
                >
                  <option value="">-- Sélectionner une immobilisation --</option>
                  {immobilisations.map((immo) => (
                    <option key={immo.id} value={immo.id}>
                      {immo.code_inventaire} - {immo.designation}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Valeur d'Acquisition (DT) *</label>
                  <Input
                    type="number"
                    step="0.01"
                    value={valeurAcquisition}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setValeurAcquisition(e.target.value)}
                    required
                    placeholder="Ex: 10000.00"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Date Début Amort. *</label>
                  <Input
                    type="date"
                    value={dateDebut}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDateDebut(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Mode d'Amortissement *</label>
                  <select
                    className="w-full mt-1 flex h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    value={mode}
                    onChange={(e) => setMode(e.target.value as ModeAmortissement)}
                    required
                  >
                    <option value="lineaire">Linéaire</option>
                    <option value="degressif">Dégressif</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium">Durée (années) *</label>
                  <Input
                    type="number"
                    min="1"
                    max="50"
                    value={duree}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleDureeChange(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Taux Annuel (%) *</label>
                  <Input
                    type="number"
                    step="0.01"
                    value={taux}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTaux(e.target.value)}
                    required
                    placeholder="Ex: 20.00"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Valeur Résiduelle (DT)</label>
                  <Input
                    type="number"
                    step="0.01"
                    value={valeurResiduelle}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setValeurResiduelle(e.target.value)}
                    placeholder="Ex: 0.00"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setIsFormModalOpen(false)}>
                  Annuler
                </Button>
                <Button type="submit">Enregistrer et Générer</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Schedule Detail Modal (Tableau d'Amortissement / Écritures) */}
      {isScheduleModalOpen && selectedPlan && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-background rounded-lg shadow-xl w-full max-w-3xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h2 className="text-xl font-bold">
                  Tableau d'Amortissement: {selectedPlan.immobilisation_designation}
                </h2>
                <p className="text-xs text-muted-foreground font-mono mt-0.5">
                  Code: {selectedPlan.immobilisation_code} | Mode: {selectedPlan.mode_amortissement_display || selectedPlan.mode_amortissement} | Durée: {selectedPlan.duree_amortissement} ans ({Number(selectedPlan.taux_amortissement).toFixed(2)}%)
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleRecalculateSchedule(selectedPlan.id)}
                disabled={recalculating}
              >
                {recalculating ? "Calcul en cours..." : "🔄 Recalculer Tableau"}
              </Button>
            </div>

            <div className="grid grid-cols-3 gap-3 text-xs bg-muted/40 p-3 rounded-md">
              <div>
                <span className="text-muted-foreground block">Valeur Acquisition:</span>
                <span className="font-bold">
                  {Number(selectedPlan.valeur_acquisition).toLocaleString("fr-FR", { minimumFractionDigits: 2 })} DT
                </span>
              </div>
              <div>
                <span className="text-muted-foreground block">Valeur Résiduelle:</span>
                <span className="font-bold">
                  {Number(selectedPlan.valeur_residuelle || 0).toLocaleString("fr-FR", { minimumFractionDigits: 2 })} DT
                </span>
              </div>
              <div>
                <span className="text-muted-foreground block">Date Début Amortissement:</span>
                <span className="font-bold">{selectedPlan.date_debut_amortissement}</span>
              </div>
            </div>

            {/* Écritures Table */}
            {!selectedPlan.ecritures || selectedPlan.ecritures.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
                Aucune écriture d'amortissement générée. Cliquez sur "Recalculer Tableau".
              </div>
            ) : (
              <div className="relative overflow-x-auto border rounded-md">
                <table className="w-full text-sm text-left border-collapse">
                  <thead className="bg-muted/70 text-muted-foreground uppercase text-xs">
                    <tr>
                      <th className="px-4 py-2.5">Exercice (Année)</th>
                      <th className="px-4 py-2.5 text-right">Annuité (DT)</th>
                      <th className="px-4 py-2.5 text-right">Amortiss. Cumulé (DT)</th>
                      <th className="px-4 py-2.5 text-right">VNC (DT)</th>
                      <th className="px-4 py-2.5 text-center">Date Calcul</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {selectedPlan.ecritures.map((ecriture: EcritureAmortissement) => (
                      <tr key={ecriture.id} className="hover:bg-muted/20">
                        <td className="px-4 py-2.5 font-bold font-mono">{ecriture.exercice}</td>
                        <td className="px-4 py-2.5 text-right font-medium text-amber-600 dark:text-amber-400">
                          {Number(ecriture.annuite).toLocaleString("fr-FR", { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-4 py-2.5 text-right font-medium">
                          {Number(ecriture.amortissement_cumule).toLocaleString("fr-FR", { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-4 py-2.5 text-right font-bold text-emerald-600 dark:text-emerald-400">
                          {Number(ecriture.valeur_nette_comptable).toLocaleString("fr-FR", { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-4 py-2.5 text-center text-xs text-muted-foreground">
                          {ecriture.date_calcul}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="flex items-center justify-between pt-2 border-t">
              <Button
                type="button"
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                onClick={() => exportPlanAmortissementToExcel(selectedPlan)}
              >
                <FileSpreadsheet className="w-4 h-4 mr-2" />
                Télécharger Excel (.xls)
              </Button>
              <Button type="button" variant="outline" onClick={() => setIsScheduleModalOpen(false)}>
                Fermer
              </Button>
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
