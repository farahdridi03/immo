"use client";

import React, { useEffect, useState, use } from "react";
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
} from "@/services/api/maintenance";
import { immobilisationsApi } from "@/services/api/immobilisations";
import type {
  ContratMaintenance,
  Intervention,
  Immobilisation,
  TypeMaintenance,
  PeriodiciteMaintenance,
  StatutContrat,
} from "@/types/api";
import {
  ArrowLeft,
  Download,
  Edit,
  FileText,
  Wrench,
  Boxes,
  Calendar,
  Building,
  DollarSign,
  Upload,
  Trash2,
  Loader2,
  Check,
} from "lucide-react";

export default function ContratDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const contratId = parseInt(resolvedParams.id, 10);
  const router = useRouter();

  const [contrat, setContrat] = useState<ContratMaintenance | null>(null);
  const [interventions, setInterventions] = useState<Intervention[]>([]);
  const [immobilisations, setImmobilisations] = useState<Immobilisation[]>([]);
  const [loading, setLoading] = useState(true);

  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [ref, setRef] = useState("");
  const [fournisseur, setFournisseur] = useState("");
  const [dateDebut, setDateDebut] = useState("");
  const [dateFin, setDateFin] = useState("");
  const [montant, setMontant] = useState("0.00");
  const [typeMaintenance, setTypeMaintenance] = useState<TypeMaintenance>("preventive");
  const [periodicite, setPeriodicite] = useState<PeriodiciteMaintenance>("mensuelle");
  const [statutContrat, setStatutContrat] = useState<StatutContrat>("actif");
  const [savingEdit, setSavingEdit] = useState(false);

  // Document Upload State
  const [docNom, setDocNom] = useState("");
  const [docFile, setDocFile] = useState<File | null>(null);
  const [uploadingDoc, setUploadingDoc] = useState(false);

  const loadContratDetails = async () => {
    setLoading(true);
    try {
      const data = await contratsApi.get(contratId);
      if (data) {
        setContrat(data);
        setRef(data.reference);
        setFournisseur(data.fournisseur);
        setDateDebut(data.date_debut);
        setDateFin(data.date_fin);
        setMontant(String(data.montant));
        setTypeMaintenance(data.type_maintenance);
        setPeriodicite(data.periodicite);
        setStatutContrat(data.statut);
      }

      // Fetch related interventions
      const allInterventions = await interventionsApi.list({ contrat: String(contratId) });
      if (Array.isArray(allInterventions)) {
        setInterventions(allInterventions);
      }

      // Fetch all immobilisations for assignment mapping
      const allImmos = await immobilisationsApi.list();
      if (Array.isArray(allImmos)) {
        setImmobilisations(allImmos);
      }
    } catch (err) {
      console.error("Erreur chargement contrat:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (contratId) {
      loadContratDetails();
    }
  }, [contratId]);

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingEdit(true);
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
      await contratsApi.update(contratId, payload);
      setIsEditModalOpen(false);
      loadContratDetails();
    } catch (err) {
      console.error("Erreur modification contrat:", err);
    } finally {
      setSavingEdit(false);
    }
  };

  const handleUploadDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docFile || !docNom) return;
    setUploadingDoc(true);

    try {
      const formData = new FormData();
      formData.append("contrat", String(contratId));
      formData.append("nom", docNom);
      formData.append("fichier", docFile);

      await documentsContratApi.create(formData);
      setDocNom("");
      setDocFile(null);
      loadContratDetails();
    } catch (err) {
      console.error("Erreur ajout document:", err);
    } finally {
      setUploadingDoc(false);
    }
  };

  const handleDeleteDocument = async (docId: number) => {
    if (!confirm("Voulez-vous supprimer ce document ?")) return;
    try {
      await documentsContratApi.delete(docId);
      loadContratDetails();
    } catch (err) {
      console.error("Erreur suppression document:", err);
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
          <span className="text-sm font-medium text-muted-foreground">Chargement des détails du contrat...</span>
        </div>
      </PageContainer>
    );
  }

  if (!contrat) {
    return (
      <PageContainer>
        <div className="p-8 text-center space-y-4">
          <h2 className="text-lg font-bold text-destructive">Contrat non trouvé</h2>
          <Button onClick={() => router.push("/maintenance")}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Retour aux contrats
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
                Contrat {contrat.reference}
              </h1>
              <Badge
                variant={
                  contrat.statut === "actif"
                    ? "default"
                    : contrat.statut === "expire"
                    ? "destructive"
                    : "outline"
                }
              >
                {contrat.statut_display || contrat.statut}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Prestataire : <span className="font-semibold text-foreground">{contrat.fournisseur}</span>
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
            <span>Télécharger PDF (Fiche Contrat)</span>
          </Button>

          <Button
            onClick={() => setIsEditModalOpen(true)}
            className="flex items-center gap-2 bg-[#1C1917] hover:bg-[#332E2B] text-white"
          >
            <Edit className="w-4 h-4" />
            <span>Modifier</span>
          </Button>
        </div>
      </div>

      {/* Main Print Header (Visible ONLY during printing/PDF export) */}
      <div className="hidden print:block border-b border-black pb-4 mb-6">
        <div className="flex justify-between items-center mb-2">
          <div>
            <h1 className="text-2xl font-bold text-black tracking-tight">FICHE DE CONTRAT DE MAINTENANCE</h1>
            <p className="text-xs font-semibold text-gray-700">GestImmo — Plateforme de Gestion des Actifs</p>
          </div>
          <div className="text-right text-xs text-gray-600">
            <div><strong>Référence :</strong> {contrat.reference}</div>
            <div><strong>Date d'Édition :</strong> {new Date().toLocaleDateString("fr-FR")}</div>
          </div>
        </div>
      </div>

      {/* Printable / Viewable Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Contract Meta & Info */}
        <div className="md:col-span-1 space-y-6">
          <Card className="border shadow-2xs">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary" />
                <span>Informations du Contrat</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-xs">
              <div className="flex items-center justify-between py-1.5 border-b">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5 text-muted-foreground" /> Prestataire
                </span>
                <span className="font-semibold text-foreground">{contrat.fournisseur}</span>
              </div>

              <div className="flex items-center justify-between py-1.5 border-b">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <Wrench className="w-3.5 h-3.5 text-muted-foreground" /> Type Maintenance
                </span>
                <span className="font-semibold capitalize text-foreground">
                  {contrat.type_maintenance_display || contrat.type_maintenance}
                </span>
              </div>

              <div className="flex items-center justify-between py-1.5 border-b">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-muted-foreground" /> Périodicité
                </span>
                <span className="font-semibold capitalize text-foreground">
                  {contrat.periodicite_display || contrat.periodicite}
                </span>
              </div>

              <div className="flex items-center justify-between py-1.5 border-b">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-muted-foreground" /> Période d'effet
                </span>
                <span className="font-semibold text-foreground">
                  {contrat.date_debut} au {contrat.date_fin}
                </span>
              </div>

              <div className="flex items-center justify-between py-1.5 border-b">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5 text-muted-foreground" /> Montant du Contrat
                </span>
                <span className="font-bold text-sm text-emerald-600 dark:text-emerald-400">
                  {Number(contrat.montant).toLocaleString("fr-FR", { minimumFractionDigits: 2 })} TND
                </span>
              </div>

              {contrat.entreprise_nom && (
                <div className="flex items-center justify-between py-1.5">
                  <span className="text-muted-foreground">Entreprise</span>
                  <span className="font-semibold text-foreground">{contrat.entreprise_nom}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Attached Documents Card */}
          <Card className="border shadow-2xs print:hidden">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary" />
                <span>Documents & Pièces Jointes</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {contrat.documents && contrat.documents.length > 0 ? (
                <div className="space-y-2">
                  {contrat.documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between p-2.5 rounded-xl border bg-muted/30 text-xs"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
                        <span className="font-medium truncate">{doc.nom}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <a
                          href={doc.fichier}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1 rounded hover:bg-muted text-primary"
                          title="Télécharger / Ouvrir"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </a>
                        <button
                          onClick={() => handleDeleteDocument(doc.id)}
                          className="p-1 rounded hover:bg-rose-50 text-rose-600"
                          title="Supprimer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">Aucun document joint à ce contrat.</p>
              )}

              {/* Upload Form */}
              <form onSubmit={handleUploadDocument} className="pt-3 border-t space-y-2">
                <div className="text-xs font-bold text-foreground">Ajouter un document</div>
                <Input
                  placeholder="Nom du document (ex: Scan PDF Signé)"
                  value={docNom}
                  onChange={(e) => setDocNom(e.target.value)}
                  className="text-xs h-8"
                  required
                />
                <input
                  type="file"
                  onChange={(e) => setDocFile(e.target.files?.[0] || null)}
                  className="text-xs w-full border rounded-lg p-1.5 bg-background"
                  required
                />
                <Button
                  type="submit"
                  size="sm"
                  disabled={uploadingDoc}
                  className="w-full text-xs h-8 flex items-center justify-center gap-1.5"
                >
                  {uploadingDoc ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Upload className="w-3.5 h-3.5" />
                  )}
                  <span>Joindre le fichier</span>
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Covered Immobilisations & Interventions */}
        <div className="md:col-span-2 space-y-6">
          {/* Immobilisations Couvertes */}
          <Card className="border shadow-2xs">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Boxes className="w-4 h-4 text-primary" />
                <span>Immobilisations Couvertes ({contrat.immobilisations_details?.length || 0})</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!contrat.immobilisations_details || contrat.immobilisations_details.length === 0 ? (
                <div className="p-6 text-center text-xs text-muted-foreground border border-dashed rounded-xl">
                  Aucune immobilisation rattachée à ce contrat pour le moment.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead>
                      <tr className="border-b bg-muted/40 font-semibold text-muted-foreground">
                        <th className="py-2.5 px-3">Code Inventaire</th>
                        <th className="py-2.5 px-3">Désignation</th>
                        <th className="py-2.5 px-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {contrat.immobilisations_details.map((ic) => (
                        <tr key={ic.id} className="border-b hover:bg-muted/20">
                          <td className="py-2.5 px-3 font-semibold text-primary">
                            {ic.immobilisation_code}
                          </td>
                          <td className="py-2.5 px-3 font-medium">
                            {ic.immobilisation_designation}
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-xs h-7 px-2"
                              onClick={() => router.push(`/immobilisations/${ic.immobilisation}`)}
                            >
                              Voir Fiche
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

          {/* Interventions Associées */}
          <Card className="border shadow-2xs">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Wrench className="w-4 h-4 text-primary" />
                <span>Interventions Rattachées ({interventions.length})</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {interventions.length === 0 ? (
                <div className="p-6 text-center text-xs text-muted-foreground border border-dashed rounded-xl">
                  Aucune intervention enregistrée sous ce contrat.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead>
                      <tr className="border-b bg-muted/40 font-semibold text-muted-foreground">
                        <th className="py-2.5 px-3">ID</th>
                        <th className="py-2.5 px-3">Immobilisation</th>
                        <th className="py-2.5 px-3">Date</th>
                        <th className="py-2.5 px-3">Technicien</th>
                        <th className="py-2.5 px-3 text-right">Coût</th>
                        <th className="py-2.5 px-3">Statut</th>
                      </tr>
                    </thead>
                    <tbody>
                      {interventions.map((i) => (
                        <tr
                          key={i.id}
                          className="border-b hover:bg-muted/20 cursor-pointer"
                          onClick={() => router.push(`/maintenance/interventions/${i.id}`)}
                        >
                          <td className="py-2.5 px-3 font-semibold">#{i.id}</td>
                          <td className="py-2.5 px-3 font-medium text-primary">
                            {i.immobilisation_code}
                          </td>
                          <td className="py-2.5 px-3">{i.date_intervention}</td>
                          <td className="py-2.5 px-3">{i.technicien || "-"}</td>
                          <td className="py-2.5 px-3 text-right font-medium">
                            {Number(i.cout).toLocaleString("fr-FR", { minimumFractionDigits: 2 })} TND
                          </td>
                          <td className="py-2.5 px-3">
                            <Badge
                              variant={
                                i.statut === "realise"
                                  ? "default"
                                  : i.statut === "en_cours"
                                  ? "secondary"
                                  : "outline"
                              }
                            >
                              {i.statut}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Edit Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 print:hidden">
          <div className="bg-background rounded-lg shadow-lg max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold">Modifier le Contrat de Maintenance</h2>
            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="text-xs font-bold block mb-1">Référence contrat *</label>
                <Input value={ref} onChange={(e) => setRef(e.target.value)} required />
              </div>
              <div>
                <label className="text-xs font-bold block mb-1">Fournisseur / Prestataire *</label>
                <Input value={fournisseur} onChange={(e) => setFournisseur(e.target.value)} required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold block mb-1">Date Début *</label>
                  <Input type="date" value={dateDebut} onChange={(e) => setDateDebut(e.target.value)} required />
                </div>
                <div>
                  <label className="text-xs font-bold block mb-1">Date Fin *</label>
                  <Input type="date" value={dateFin} onChange={(e) => setDateFin(e.target.value)} required />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold block mb-1">Montant (TND)</label>
                  <Input type="number" step="0.01" value={montant} onChange={(e) => setMontant(e.target.value)} />
                </div>
                <div>
                  <label className="text-xs font-bold block mb-1">Type de Maintenance</label>
                  <select
                    className="w-full border rounded-md px-3 py-2 text-xs bg-background"
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
                  <label className="text-xs font-bold block mb-1">Périodicité</label>
                  <select
                    className="w-full border rounded-md px-3 py-2 text-xs bg-background"
                    value={periodicite}
                    onChange={(e) => setPeriodicite(e.target.value as PeriodiciteMaintenance)}
                  >
                    <option value="mensuelle">Mensuelle</option>
                    <option value="trimestrielle">Trimestrielle</option>
                    <option value="annuelle">Annuelle</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold block mb-1">Statut</label>
                  <select
                    className="w-full border rounded-md px-3 py-2 text-xs bg-background"
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
