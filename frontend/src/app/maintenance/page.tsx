"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PageContainer } from "@/components/layout/PageContainer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  contratsApi,
  documentsContratApi,
  interventionsApi,
  alertesApi,
} from "@/services/api/maintenance";
import { immobilisationsApi } from "@/services/api/immobilisations";
import type {
  ContratMaintenance,
  Intervention,
  Alerte,
  Immobilisation,
  TypeMaintenance,
  PeriodiciteMaintenance,
  StatutContrat,
  StatutIntervention,
} from "@/types/api";

export default function MaintenancePage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"contrats" | "interventions" | "alertes">("contrats");

  const [contrats, setContrats] = useState<ContratMaintenance[]>([]);
  const [interventions, setInterventions] = useState<Intervention[]>([]);
  const [alertes, setAlertes] = useState<Alerte[]>([]);
  const [immobilisations, setImmobilisations] = useState<Immobilisation[]>([]);

  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [isContratModalOpen, setIsContratModalOpen] = useState(false);
  const [editingContratId, setEditingContratId] = useState<number | null>(null);
  const [ref, setRef] = useState("");
  const [fournisseur, setFournisseur] = useState("");
  const [dateDebut, setDateDebut] = useState("");
  const [dateFin, setDateFin] = useState("");
  const [montant, setMontant] = useState("0.00");
  const [typeMaintenance, setTypeMaintenance] = useState<TypeMaintenance>("preventive");
  const [periodicite, setPeriodicite] = useState<PeriodiciteMaintenance>("mensuelle");
  const [statutContrat, setStatutContrat] = useState<StatutContrat>("actif");

  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedContrat, setSelectedContrat] = useState<ContratMaintenance | null>(null);
  const [selectedImmobilisationIds, setSelectedImmobilisationIds] = useState<number[]>([]);

  const [isInterventionModalOpen, setIsInterventionModalOpen] = useState(false);
  const [editingInterventionId, setEditingInterventionId] = useState<number | null>(null);
  const [interContratId, setInterContratId] = useState<string>("");
  const [interImmoId, setInterImmoId] = useState<string>("");
  const [dateIntervention, setDateIntervention] = useState(new Date().toISOString().split("T")[0]);
  const [typeIntervention, setTypeIntervention] = useState("Préventive");
  const [description, setDescription] = useState("");
  const [technicien, setTechnicien] = useState("");
  const [cout, setCout] = useState("0.00");
  const [statutIntervention, setStatutIntervention] = useState<StatutIntervention>("planifie");

  const loadData = async () => {
    setLoading(true);
    try {
      const [cRes, iRes, aRes, immoRes] = await Promise.all([
        contratsApi.list(search ? { search } : undefined),
        interventionsApi.list(),
        alertesApi.list(),
        immobilisationsApi.list(),
      ]);
      if (Array.isArray(cRes)) setContrats(cRes);
      if (Array.isArray(iRes)) setInterventions(iRes);
      if (Array.isArray(aRes)) setAlertes(aRes);
      if (Array.isArray(immoRes)) setImmobilisations(immoRes);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [search]);

  const handleOpenContratModal = (contrat?: ContratMaintenance) => {
    if (contrat) {
      setEditingContratId(contrat.id);
      setRef(contrat.reference);
      setFournisseur(contrat.fournisseur);
      setDateDebut(contrat.date_debut);
      setDateFin(contrat.date_fin);
      setMontant(String(contrat.montant));
      setTypeMaintenance(contrat.type_maintenance);
      setPeriodicite(contrat.periodicite);
      setStatutContrat(contrat.statut);
    } else {
      setEditingContratId(null);
      setRef("");
      setFournisseur("");
      setDateDebut(new Date().toISOString().split("T")[0]);
      setDateFin("");
      setMontant("0.00");
      setTypeMaintenance("preventive");
      setPeriodicite("mensuelle");
      setStatutContrat("actif");
    }
    setIsContratModalOpen(true);
  };

  const handleSaveContrat = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload: Partial<ContratMaintenance> = {
        reference: ref,
        fournisseur,
        date_debut: dateDebut,
        date_fin: dateFin,
        montant: parseFloat(montant) || 0,
        type_maintenance: typeMaintenance,
        periodicite,
        statut: statutContrat,
      };
      if (editingContratId) {
        await contratsApi.update(editingContratId, payload);
      } else {
        await contratsApi.create(payload);
      }
      setIsContratModalOpen(false);
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteContrat = async (id: number) => {
    if (!confirm("Voulez-vous vraiment supprimer ce contrat de maintenance ?")) return;
    try {
      await contratsApi.delete(id);
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenAssignModal = (contrat: ContratMaintenance) => {
    setSelectedContrat(contrat);
    const existing = contrat.immobilisations_details
      ? contrat.immobilisations_details.map((ic) => ic.immobilisation)
      : [];
    setSelectedImmobilisationIds(existing);
    setIsAssignModalOpen(true);
  };

  const handleSaveAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedContrat) return;
    try {
      await contratsApi.assignImmobilisations(selectedContrat.id, selectedImmobilisationIds);
      setIsAssignModalOpen(false);
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenInterventionModal = (inter?: Intervention) => {
    if (inter) {
      setEditingInterventionId(inter.id);
      setInterContratId(inter.contrat ? String(inter.contrat) : "");
      setInterImmoId(String(inter.immobilisation));
      setDateIntervention(inter.date_intervention);
      setTypeIntervention(inter.type_intervention);
      setDescription(inter.description || "");
      setTechnicien(inter.technicien || "");
      setCout(String(inter.cout));
      setStatutIntervention(inter.statut);
    } else {
      setEditingInterventionId(null);
      setInterContratId("");
      setInterImmoId(immobilisations[0] ? String(immobilisations[0].id) : "");
      setDateIntervention(new Date().toISOString().split("T")[0]);
      setTypeIntervention("Préventive");
      setDescription("");
      setTechnicien("");
      setCout("0.00");
      setStatutIntervention("planifie");
    }
    setIsInterventionModalOpen(true);
  };

  const handleSaveIntervention = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload: Partial<Intervention> = {
        contrat: interContratId ? parseInt(interContratId, 10) : null,
        immobilisation: parseInt(interImmoId, 10),
        date_intervention: dateIntervention,
        type_intervention: typeIntervention,
        description,
        technicien,
        cout: parseFloat(cout) || 0,
        statut: statutIntervention,
      };
      if (editingInterventionId) {
        await interventionsApi.update(editingInterventionId, payload);
      } else {
        await interventionsApi.create(payload);
      }
      setIsInterventionModalOpen(false);
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteIntervention = async (id: number) => {
    if (!confirm("Voulez-vous supprimer cette intervention ?")) return;
    try {
      await interventionsApi.delete(id);
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarquerLu = async (id: number) => {
    try {
      await alertesApi.marquerLu(id);
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteAlerte = async (id: number) => {
    try {
      await alertesApi.delete(id);
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const totalContratsActifs = contrats.filter((c) => c.statut === "actif").length;
  const interventionsPlanifiees = interventions.filter((i) => i.statut === "planifie" || i.statut === "en_cours").length;
  const alertesNonLues = alertes.filter((a) => a.statut_lecture === "non_lu").length;
  const coutTotalInterventions = interventions.reduce((sum, i) => sum + Number(i.cout || 0), 0);

  return (
    <PageContainer>
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Gestion de la Maintenance</h1>
        <p className="text-muted-foreground">Suivi des contrats, interventions techniques, affectation des immobilisations et alertes.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="bg-card border shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Contrats Actifs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{totalContratsActifs} / {contrats.length}</div>
          </CardContent>
        </Card>
        <Card className="bg-card border shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Interventions à venir</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">{interventionsPlanifiees}</div>
          </CardContent>
        </Card>
        <Card className="bg-card border shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Alertes Non Lues</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-rose-600 dark:text-rose-400">{alertesNonLues}</div>
          </CardContent>
        </Card>
        <Card className="bg-card border shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Coût Interventions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {coutTotalInterventions.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} TND
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex space-x-2 border-b mb-6 pb-2">
        <button
          onClick={() => setActiveTab("contrats")}
          className={`px-4 py-2 text-sm font-medium rounded-t-md transition-colors ${
            activeTab === "contrats"
              ? "bg-primary text-primary-foreground border-b-2 border-primary"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Contrats de Maintenance ({contrats.length})
        </button>
        <button
          onClick={() => setActiveTab("interventions")}
          className={`px-4 py-2 text-sm font-medium rounded-t-md transition-colors ${
            activeTab === "interventions"
              ? "bg-primary text-primary-foreground border-b-2 border-primary"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Interventions ({interventions.length})
        </button>
        <button
          onClick={() => setActiveTab("alertes")}
          className={`px-4 py-2 text-sm font-medium rounded-t-md transition-colors relative ${
            activeTab === "alertes"
              ? "bg-primary text-primary-foreground border-b-2 border-primary"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Alertes ({alertes.length})
          {alertesNonLues > 0 && (
            <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500 text-white">
              {alertesNonLues}
            </span>
          )}
        </button>
      </div>

      {activeTab === "contrats" && (
        <Card className="border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle className="text-lg font-semibold">Liste des Contrats</CardTitle>
            <div className="flex items-center space-x-2">
              <Input
                placeholder="Rechercher par référence ou fournisseur..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-64"
              />
              <Button onClick={() => handleOpenContratModal()}>+ Nouveau Contrat</Button>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="p-8 text-center text-muted-foreground">Chargement des contrats...</div>
            ) : contrats.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">Aucun contrat enregistré.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left border-collapse">
                  <thead>
                    <tr className="border-b bg-muted/50 text-muted-foreground font-medium">
                      <th className="py-3 px-4">Référence</th>
                      <th className="py-3 px-4">Fournisseur</th>
                      <th className="py-3 px-4">Type</th>
                      <th className="py-3 px-4">Périodicité</th>
                      <th className="py-3 px-4">Dates</th>
                      <th className="py-3 px-4 text-right">Montant (TND)</th>
                      <th className="py-3 px-4">Immobilisations</th>
                      <th className="py-3 px-4">Statut</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {contrats.map((c) => (
                      <tr key={c.id} className="border-b hover:bg-muted/20 transition-colors">
                        <td className="py-3 px-4 font-medium">{c.reference}</td>
                        <td className="py-3 px-4">{c.fournisseur}</td>
                        <td className="py-3 px-4 capitalize">{c.type_maintenance}</td>
                        <td className="py-3 px-4 capitalize">{c.periodicite}</td>
                        <td className="py-3 px-4 text-xs text-muted-foreground">
                          {c.date_debut} au {c.date_fin}
                        </td>
                        <td className="py-3 px-4 text-right font-semibold">
                          {Number(c.montant).toLocaleString("fr-FR", { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 px-4">
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-xs py-1 h-auto"
                            onClick={() => handleOpenAssignModal(c)}
                          >
                            {c.immobilisations_details?.length || 0} liées
                          </Button>
                        </td>
                        <td className="py-3 px-4">
                          <Badge
                            variant={
                              c.statut === "actif"
                                ? "default"
                                : c.statut === "expire"
                                ? "destructive"
                                : "outline"
                            }
                          >
                            {c.statut}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-right space-x-2">
                          <Button variant="outline" size="sm" onClick={() => router.push(`/maintenance/contrats/${c.id}`)}>
                            Voir
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleOpenContratModal(c)}>
                            Modifier
                          </Button>
                          <Button variant="ghost" size="sm" className="text-rose-600 hover:text-rose-700" onClick={() => handleDeleteContrat(c.id)}>
                            Supprimer
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === "interventions" && (
        <Card className="border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle className="text-lg font-semibold">Historique et Suivi des Interventions</CardTitle>
            <Button onClick={() => handleOpenInterventionModal()}>+ Nouvelle Intervention</Button>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="p-8 text-center text-muted-foreground">Chargement des interventions...</div>
            ) : interventions.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">Aucune intervention enregistrée.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left border-collapse">
                  <thead>
                    <tr className="border-b bg-muted/50 text-muted-foreground font-medium">
                      <th className="py-3 px-4">ID</th>
                      <th className="py-3 px-4">Immobilisation</th>
                      <th className="py-3 px-4">Contrat</th>
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4">Type</th>
                      <th className="py-3 px-4">Technicien</th>
                      <th className="py-3 px-4 text-right">Coût</th>
                      <th className="py-3 px-4">Statut</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {interventions.map((i) => (
                      <tr key={i.id} className="border-b hover:bg-muted/20 transition-colors">
                        <td className="py-3 px-4 font-medium">#{i.id}</td>
                        <td className="py-3 px-4 font-semibold text-primary">
                          {i.immobilisation_code || `#${i.immobilisation}`} {i.immobilisation_designation && `(${i.immobilisation_designation})`}
                        </td>
                        <td className="py-3 px-4 text-xs text-muted-foreground">
                          {i.contrat_reference || "Hors contrat"}
                        </td>
                        <td className="py-3 px-4">{i.date_intervention}</td>
                        <td className="py-3 px-4">{i.type_intervention}</td>
                        <td className="py-3 px-4">{i.technicien || "-"}</td>
                        <td className="py-3 px-4 text-right font-medium">
                          {Number(i.cout).toLocaleString("fr-FR", { minimumFractionDigits: 2 })} TND
                        </td>
                        <td className="py-3 px-4">
                          <Badge
                            variant={
                              i.statut === "realise"
                                ? "default"
                                : i.statut === "en_cours"
                                ? "secondary"
                                : i.statut === "annule"
                                ? "destructive"
                                : "outline"
                            }
                          >
                            {i.statut}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-right space-x-2">
                          <Button variant="outline" size="sm" onClick={() => router.push(`/maintenance/interventions/${i.id}`)}>
                            Voir
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleOpenInterventionModal(i)}>
                            Modifier
                          </Button>
                          <Button variant="ghost" size="sm" className="text-rose-600 hover:text-rose-700" onClick={() => handleDeleteIntervention(i.id)}>
                            Supprimer
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === "alertes" && (
        <Card className="border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle className="text-lg font-semibold">Alertes et Notifications Contrats</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="p-8 text-center text-muted-foreground">Chargement des alertes...</div>
            ) : alertes.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">Aucune alerte reçue.</div>
            ) : (
              <div className="space-y-3">
                {alertes.map((a) => (
                  <div
                    key={a.id}
                    className={`p-4 rounded-lg border flex items-center justify-between transition-colors ${
                      a.statut_lecture === "non_lu"
                        ? "bg-rose-50 border-rose-200 dark:bg-rose-950/20 dark:border-rose-900"
                        : "bg-card border-border"
                    }`}
                  >
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold text-sm capitalize">{a.type_alerte}</span>
                        <Badge variant={a.statut_lecture === "non_lu" ? "destructive" : "outline"}>
                          {a.statut_lecture === "non_lu" ? "Non lu" : "Lu"}
                        </Badge>
                      </div>
                      <p className="text-sm mt-1 text-foreground">{a.message}</p>
                      <span className="text-xs text-muted-foreground block mt-1">
                        {new Date(a.date_alerte).toLocaleString("fr-FR")}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      {a.statut_lecture === "non_lu" && (
                        <Button variant="outline" size="sm" onClick={() => handleMarquerLu(a.id)}>
                          Marquer comme lu
                        </Button>
                      )}
                      <Button variant="ghost" size="sm" className="text-rose-600 hover:text-rose-700" onClick={() => handleDeleteAlerte(a.id)}>
                        Supprimer
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {isContratModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-background rounded-lg shadow-lg max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold">
              {editingContratId ? "Modifier le Contrat" : "Nouveau Contrat de Maintenance"}
            </h2>
            <form onSubmit={handleSaveContrat} className="space-y-4">
              <div>
                <label className="text-sm font-medium block mb-1">Référence contrat *</label>
                <Input value={ref} onChange={(e) => setRef(e.target.value)} required placeholder="ex: MAINT-2026-001" />
              </div>
              <div>
                <label className="text-sm font-medium block mb-1">Fournisseur / Prestataire *</label>
                <Input value={fournisseur} onChange={(e) => setFournisseur(e.target.value)} required placeholder="ex: TechServices SARL" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium block mb-1">Date Début *</label>
                  <Input type="date" value={dateDebut} onChange={(e) => setDateDebut(e.target.value)} required />
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1">Date Fin *</label>
                  <Input type="date" value={dateFin} onChange={(e) => setDateFin(e.target.value)} required />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium block mb-1">Montant (TND)</label>
                  <Input type="number" step="0.01" value={montant} onChange={(e) => setMontant(e.target.value)} />
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1">Type de Maintenance</label>
                  <select
                    className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                    value={typeMaintenance}
                    onChange={(e) => setTypeMaintenance(e.target.value as TypeMaintenance)}
                  >
                    <option value="preventive">Préventive</option>
                    <option value="corrective">Corrective</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium block mb-1">Périodicité</label>
                  <select
                    className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                    value={periodicite}
                    onChange={(e) => setPeriodicite(e.target.value as PeriodiciteMaintenance)}
                  >
                    <option value="mensuelle">Mensuelle</option>
                    <option value="trimestrielle">Trimestrielle</option>
                    <option value="annuelle">Annuelle</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1">Statut</label>
                  <select
                    className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                    value={statutContrat}
                    onChange={(e) => setStatutContrat(e.target.value as StatutContrat)}
                  >
                    <option value="actif">Actif</option>
                    <option value="expire">Expiré</option>
                    <option value="resilie">Résilié</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end space-x-2 pt-4 border-t">
                <Button type="button" variant="outline" onClick={() => setIsContratModalOpen(false)}>
                  Annuler
                </Button>
                <Button type="submit">Enregistrer</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isAssignModalOpen && selectedContrat && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-background rounded-lg shadow-lg max-w-md w-full p-6 space-y-4 max-h-[80vh] overflow-y-auto">
            <h2 className="text-xl font-bold">Immobilisations Couvertes</h2>
            <p className="text-sm text-muted-foreground">
              Sélectionnez les biens couverts par le contrat <span className="font-semibold">{selectedContrat.reference}</span>.
            </p>
            <form onSubmit={handleSaveAssign} className="space-y-4">
              <div className="space-y-2 border rounded-md p-3 max-h-60 overflow-y-auto">
                {immobilisations.length === 0 ? (
                  <p className="text-xs text-muted-foreground">Aucune immobilisation disponible.</p>
                ) : (
                  immobilisations.map((immo) => {
                    const isChecked = selectedImmobilisationIds.includes(immo.id);
                    return (
                      <label key={immo.id} className="flex items-center space-x-2 text-sm cursor-pointer hover:bg-muted/30 p-1 rounded">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedImmobilisationIds([...selectedImmobilisationIds, immo.id]);
                            } else {
                              setSelectedImmobilisationIds(selectedImmobilisationIds.filter((id) => id !== immo.id));
                            }
                          }}
                          className="rounded border-gray-300"
                        />
                        <span>
                          <strong className="font-medium">{immo.code_inventaire}</strong> - {immo.designation}
                        </span>
                      </label>
                    );
                  })
                )}
              </div>
              <div className="flex justify-end space-x-2 pt-4 border-t">
                <Button type="button" variant="outline" onClick={() => setIsAssignModalOpen(false)}>
                  Annuler
                </Button>
                <Button type="submit">Sauvegarder l&apos;affectation</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isInterventionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-background rounded-lg shadow-lg max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold">
              {editingInterventionId ? "Modifier Intervention" : "Nouvelle Intervention Technique"}
            </h2>
            <form onSubmit={handleSaveIntervention} className="space-y-4">
              <div>
                <label className="text-sm font-medium block mb-1">Immobilisation *</label>
                <select
                  className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                  value={interImmoId}
                  onChange={(e) => setInterImmoId(e.target.value)}
                  required
                >
                  <option value="">-- Sélectionner une immobilisation --</option>
                  {immobilisations.map((immo) => (
                    <option key={immo.id} value={immo.id}>
                      {immo.code_inventaire} - {immo.designation}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium block mb-1">Contrat associé (optionnel)</label>
                <select
                  className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                  value={interContratId}
                  onChange={(e) => setInterContratId(e.target.value)}
                >
                  <option value="">-- Aucun contrat (Hors contrat) --</option>
                  {contrats.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.reference} ({c.fournisseur})
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium block mb-1">Date Intervention *</label>
                  <Input type="date" value={dateIntervention} onChange={(e) => setDateIntervention(e.target.value)} required />
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1">Type Intervention *</label>
                  <Input value={typeIntervention} onChange={(e) => setTypeIntervention(e.target.value)} required placeholder="ex: Vidange / Réparation" />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium block mb-1">Technicien / Intervenant</label>
                <Input value={technicien} onChange={(e) => setTechnicien(e.target.value)} placeholder="ex: Jean Dupont" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium block mb-1">Coût (TND)</label>
                  <Input type="number" step="0.01" value={cout} onChange={(e) => setCout(e.target.value)} />
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1">Statut</label>
                  <select
                    className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                    value={statutIntervention}
                    onChange={(e) => setStatutIntervention(e.target.value as StatutIntervention)}
                  >
                    <option value="planifie">Planifiée</option>
                    <option value="en_cours">En cours</option>
                    <option value="realise">Réalisée</option>
                    <option value="annule">Annulée</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium block mb-1">Description / Rapport</label>
                <textarea
                  className="w-full border rounded-md p-2 text-sm bg-background"
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Détails des travaux effectués..."
                />
              </div>
              <div className="flex justify-end space-x-2 pt-4 border-t">
                <Button type="button" variant="outline" onClick={() => setIsInterventionModalOpen(false)}>
                  Annuler
                </Button>
                <Button type="submit">Enregistrer</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
