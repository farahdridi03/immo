"use client";

import React, { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { PageContainer } from "@/components/layout/PageContainer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  interventionsApi,
  contratsApi,
} from "@/services/api/maintenance";
import { immobilisationsApi } from "@/services/api/immobilisations";
import type {
  Intervention,
  ContratMaintenance,
  Immobilisation,
  StatutIntervention,
} from "@/types/api";
import {
  ArrowLeft,
  Download,
  Edit,
  Wrench,
  Boxes,
  Calendar,
  User,
  DollarSign,
  FileText,
  Loader2,
  Check,
} from "lucide-react";

export default function InterventionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const interventionId = parseInt(resolvedParams.id, 10);
  const router = useRouter();

  const [intervention, setIntervention] = useState<Intervention | null>(null);
  const [contrats, setContrats] = useState<ContratMaintenance[]>([]);
  const [immobilisations, setImmobilisations] = useState<Immobilisation[]>([]);
  const [loading, setLoading] = useState(true);

  // Edit State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [interContratId, setInterContratId] = useState<string>("");
  const [interImmoId, setInterImmoId] = useState<string>("");
  const [dateIntervention, setDateIntervention] = useState("");
  const [typeIntervention, setTypeIntervention] = useState("");
  const [description, setDescription] = useState("");
  const [technicien, setTechnicien] = useState("");
  const [cout, setCout] = useState("0.00");
  const [statutIntervention, setStatutIntervention] = useState<StatutIntervention>("planifie");
  const [savingEdit, setSavingEdit] = useState(false);

  const loadInterventionDetails = async () => {
    setLoading(true);
    try {
      const data = await interventionsApi.get(interventionId);
      if (data) {
        setIntervention(data);
        setInterContratId(data.contrat ? String(data.contrat) : "");
        setInterImmoId(String(data.immobilisation));
        setDateIntervention(data.date_intervention);
        setTypeIntervention(data.type_intervention);
        setDescription(data.description || "");
        setTechnicien(data.technicien || "");
        setCout(String(data.cout));
        setStatutIntervention(data.statut);
      }

      const [cRes, immoRes] = await Promise.all([
        contratsApi.list(),
        immobilisationsApi.list(),
      ]);
      if (Array.isArray(cRes)) setContrats(cRes);
      if (Array.isArray(immoRes)) setImmobilisations(immoRes);
    } catch (err) {
      console.error("Erreur chargement intervention:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (interventionId) {
      loadInterventionDetails();
    }
  }, [interventionId]);

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingEdit(true);
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
      await interventionsApi.update(interventionId, payload);
      setIsEditModalOpen(false);
      loadInterventionDetails();
    } catch (err) {
      console.error("Erreur mise à jour intervention:", err);
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDownloadPDF = () => {
    window.print();
  };

  if (loading) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-[#1C1917] mr-3" />
          <span className="text-sm font-medium text-muted-foreground">Chargement de l'intervention...</span>
        </div>
      </PageContainer>
    );
  }

  if (!intervention) {
    return (
      <PageContainer>
        <div className="p-8 text-center space-y-4">
          <h2 className="text-lg font-bold text-destructive">Intervention non trouvée</h2>
          <Button onClick={() => router.push("/maintenance")}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Retour aux interventions
          </Button>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-5 mb-6 print:hidden">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push("/maintenance")}
            className="h-9 px-3"
          >
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            Retour
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight">
                Intervention #{intervention.id}
              </h1>
              <Badge
                variant={
                  intervention.statut === "realise"
                    ? "default"
                    : intervention.statut === "en_cours"
                    ? "secondary"
                    : intervention.statut === "annule"
                    ? "destructive"
                    : "outline"
                }
              >
                {intervention.statut_display || intervention.statut}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Type : <span className="font-semibold text-foreground">{intervention.type_intervention}</span>
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleDownloadPDF}
            className="flex items-center gap-2 bg-white shadow-2xs hover:bg-[#FAF8F2]"
          >
            <Download className="w-4 h-4 text-[#1C1917]" />
            <span>Télécharger PDF</span>
          </Button>

          <Button
            onClick={() => setIsEditModalOpen(true)}
            className="flex items-center gap-2 bg-[#1C1917] hover:bg-[#332E2B] text-white"
          >
            <Edit className="w-4 h-4" />
            <span>Modifier Intervention</span>
          </Button>
        </div>
      </div>

      {/* Main Print Header (Visible ONLY during printing/PDF export) */}
      <div className="hidden print:block border-b border-black pb-4 mb-6">
        <div className="flex justify-between items-center mb-2">
          <div>
            <h1 className="text-2xl font-bold text-black tracking-tight">RAPPORT D'INTERVENTION TECHNIQUE</h1>
            <p className="text-xs font-semibold text-gray-700">GestImmo — Plateforme de Gestion des Actifs</p>
          </div>
          <div className="text-right text-xs text-gray-600">
            <div><strong>ID Intervention :</strong> #{intervention.id}</div>
            <div><strong>Date d'Édition :</strong> {new Date().toLocaleDateString("fr-FR")}</div>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Information Summary Card */}
        <div className="md:col-span-1 space-y-6">
          <Card className="border shadow-2xs">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Wrench className="w-4 h-4 text-primary" />
                <span>Détails de l'Intervention</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-xs">
              <div className="flex items-center justify-between py-1.5 border-b">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <Boxes className="w-3.5 h-3.5 text-muted-foreground" /> Immobilisation
                </span>
                <span className="font-bold text-primary">
                  {intervention.immobilisation_code || `#${intervention.immobilisation}`}
                </span>
              </div>

              {intervention.immobilisation_designation && (
                <div className="flex items-center justify-between py-1.5 border-b">
                  <span className="text-muted-foreground">Désignation</span>
                  <span className="font-semibold text-foreground text-right">{intervention.immobilisation_designation}</span>
                </div>
              )}

              <div className="flex items-center justify-between py-1.5 border-b">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-muted-foreground" /> Contrat Associé
                </span>
                <span className="font-semibold text-foreground">
                  {intervention.contrat_reference || "Hors contrat"}
                </span>
              </div>

              <div className="flex items-center justify-between py-1.5 border-b">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-muted-foreground" /> Date d'intervention
                </span>
                <span className="font-semibold text-foreground">{intervention.date_intervention}</span>
              </div>

              <div className="flex items-center justify-between py-1.5 border-b">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-muted-foreground" /> Technicien
                </span>
                <span className="font-semibold text-foreground">{intervention.technicien || "Non spécifié"}</span>
              </div>

              <div className="flex items-center justify-between py-1.5">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5 text-muted-foreground" /> Coût de la prestation
                </span>
                <span className="font-bold text-sm text-blue-600 dark:text-blue-400">
                  {Number(intervention.cout).toLocaleString("fr-FR", { minimumFractionDigits: 2 })} TND
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Report & Notes */}
        <div className="md:col-span-2 space-y-6">
          <Card className="border shadow-2xs">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary" />
                <span>Rapport Technique & Description</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-muted/30 border rounded-xl space-y-2">
                <h4 className="text-xs font-bold text-foreground">Description des travaux réalisés :</h4>
                <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-line">
                  {intervention.description || "Aucune description saisie pour cette intervention."}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t text-xs">
                <div>
                  <span className="text-muted-foreground block">Statut Actuel :</span>
                  <span className="font-bold text-foreground capitalize mt-0.5 block">
                    {intervention.statut_display || intervention.statut}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block">Créé le :</span>
                  <span className="font-medium text-foreground mt-0.5 block">
                    {new Date(intervention.created_at).toLocaleString("fr-FR")}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Edit Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 print:hidden">
          <div className="bg-background rounded-lg shadow-lg max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold">Modifier Intervention</h2>
            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="text-xs font-bold block mb-1">Immobilisation *</label>
                <select
                  className="w-full border rounded-md px-3 py-2 text-xs bg-background"
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
                <label className="text-xs font-bold block mb-1">Contrat associé (optionnel)</label>
                <select
                  className="w-full border rounded-md px-3 py-2 text-xs bg-background"
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
                  <label className="text-xs font-bold block mb-1">Date Intervention *</label>
                  <Input type="date" value={dateIntervention} onChange={(e) => setDateIntervention(e.target.value)} required />
                </div>
                <div>
                  <label className="text-xs font-bold block mb-1">Type Intervention *</label>
                  <Input value={typeIntervention} onChange={(e) => setTypeIntervention(e.target.value)} required />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold block mb-1">Technicien / Intervenant</label>
                <Input value={technicien} onChange={(e) => setTechnicien(e.target.value)} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold block mb-1">Coût (TND)</label>
                  <Input type="number" step="0.01" value={cout} onChange={(e) => setCout(e.target.value)} />
                </div>
                <div>
                  <label className="text-xs font-bold block mb-1">Statut</label>
                  <select
                    className="w-full border rounded-md px-3 py-2 text-xs bg-background"
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
                <label className="text-xs font-bold block mb-1">Description / Rapport</label>
                <textarea
                  className="w-full border rounded-md p-2 text-xs bg-background"
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div className="flex justify-end space-x-2 pt-4 border-t">
                <Button type="button" variant="outline" onClick={() => setIsEditModalOpen(false)}>
                  Annuler
                </Button>
                <Button type="submit" disabled={savingEdit}>
                  {savingEdit ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Check className="w-4 h-4 mr-1" />}
                  <span>Enregistrer</span>
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
