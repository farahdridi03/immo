"use client";

import React, { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { PageContainer } from "@/components/layout/PageContainer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  immobilisationsApi,
  emplacementsApi,
  famillesApi,
  mouvementsEmplacementApi,
} from "@/services/api/immobilisations";
import { usersApi } from "@/services/api/users";
import type {
  Immobilisation,
  Emplacement,
  Famille,
  MouvementEmplacement,
  Utilisateur,
  EtatImmobilisation,
  StatutImmobilisation,
} from "@/types/api";
import {
  ArrowLeft,
  ArrowRightLeft,
  Edit,
  Boxes,
  MapPin,
  Calendar,
  Building,
  DollarSign,
  User,
  History,
  Loader2,
  Check,
  FileText,
  Download,
  QrCode,
} from "lucide-react";

export default function ImmobilisationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const immoId = parseInt(resolvedParams.id, 10);
  const router = useRouter();

  const [item, setItem] = useState<Immobilisation | null>(null);
  const [familles, setFamilles] = useState<Famille[]>([]);
  const [emplacements, setEmplacements] = useState<Emplacement[]>([]);
  const [usersList, setUsersList] = useState<Utilisateur[]>([]);
  const [mouvements, setMouvements] = useState<MouvementEmplacement[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"infos" | "historique">("infos");

  // Transfer Modal State
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [nouvelEmplacementId, setNouvelEmplacementId] = useState<string>("");
  const [motifTransfert, setMotifTransfert] = useState("");
  const [utilisateurConcerneId, setUtilisateurConcerneId] = useState<string>("");
  const [commentaireTransfert, setCommentaireTransfert] = useState("");
  const [transferring, setTransferring] = useState(false);
  const [transferError, setTransferError] = useState("");

  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [codeInventaire, setCodeInventaire] = useState("");
  const [designation, setDesignation] = useState("");
  const [description, setDescription] = useState("");
  const [familleId, setFamilleId] = useState<string>("");
  const [fournisseur, setFournisseur] = useState("");
  const [numeroSerie, setNumeroSerie] = useState("");
  const [valeurAcquisition, setValeurAcquisition] = useState("");
  const [etat, setEtat] = useState<EtatImmobilisation>("neuf");
  const [statut, setStatut] = useState<StatutImmobilisation>("en_service");
  const [savingEdit, setSavingEdit] = useState(false);

  const loadDetails = async () => {
    setLoading(true);
    try {
      const data = await immobilisationsApi.get(immoId);
      if (data) {
        setItem(data);
        setCodeInventaire(data.code_inventaire);
        setDesignation(data.designation);
        setDescription(data.description || "");
        setFamilleId(data.famille ? String(data.famille) : "");
        setFournisseur(data.fournisseur || "");
        setNumeroSerie(data.numero_serie || "");
        setValeurAcquisition(data.valeur_acquisition ? String(data.valeur_acquisition) : "");
        setEtat(data.etat);
        setStatut(data.statut);
      }

      const [mouvRes, empRes, famRes, usrRes] = await Promise.all([
        mouvementsEmplacementApi.list({ immobilisation: String(immoId) }),
        emplacementsApi.list(),
        famillesApi.list(),
        usersApi.list(),
      ]);

      if (Array.isArray(mouvRes)) setMouvements(mouvRes);
      if (Array.isArray(empRes)) setEmplacements(empRes);
      if (Array.isArray(famRes)) setFamilles(famRes);
      if (Array.isArray(usrRes)) setUsersList(usrRes);
    } catch (err) {
      console.error("Erreur chargement détails immobilisation:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (immoId) {
      loadDetails();
    }
  }, [immoId]);

  const handleOpenTransferModal = () => {
    setNouvelEmplacementId("");
    setMotifTransfert("");
    setUtilisateurConcerneId("");
    setCommentaireTransfert("");
    setTransferError("");
    setIsTransferModalOpen(true);
  };

  const handleExecuteTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nouvelEmplacementId) {
      setTransferError("Veuillez choisir un nouvel emplacement.");
      return;
    }
    setTransferring(true);
    setTransferError("");

    try {
      await immobilisationsApi.transferer(immoId, {
        nouvel_emplacement: parseInt(nouvelEmplacementId, 10),
        motif: motifTransfert,
        utilisateur_concerne: utilisateurConcerneId ? parseInt(utilisateurConcerneId, 10) : null,
        commentaire: commentaireTransfert,
      });

      setIsTransferModalOpen(false);
      await loadDetails();
      setActiveTab("historique");
    } catch (err: any) {
      console.error("Erreur transfert immobilisation:", err);
      setTransferError(err?.message || "Erreur lors de l'exécution du transfert.");
    } finally {
      setTransferring(false);
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingEdit(true);
    try {
      const payload: Partial<Immobilisation> = {
        code_inventaire: codeInventaire,
        designation,
        description,
        famille: familleId ? parseInt(familleId, 10) : null,
        fournisseur,
        numero_serie: numeroSerie,
        valeur_acquisition: valeurAcquisition ? parseFloat(valeurAcquisition) : null,
        etat,
        statut,
      };
      await immobilisationsApi.update(immoId, payload);
      setIsEditModalOpen(false);
      loadDetails();
    } catch (err) {
      console.error("Erreur modification:", err);
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDownloadPDF = () => {
    window.print();
  };

  const handleDownloadQrCode = () => {
    if (!item?.qr_code_base64) return;
    const link = document.createElement("a");
    link.href = item.qr_code_base64.startsWith("data:")
      ? item.qr_code_base64
      : `data:image/png;base64,${item.qr_code_base64}`;
    link.download = `QR_${item.code_inventaire}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getEtatColor = (val: EtatImmobilisation) => {
    switch (val) {
      case "neuf":
        return "bg-emerald-500/10 text-emerald-600 border-emerald-500/20";
      case "bon":
        return "bg-blue-500/10 text-blue-600 border-blue-500/20";
      case "moyen":
        return "bg-amber-500/10 text-amber-600 border-amber-500/20";
      case "mauvais":
      case "hors_service":
        return "bg-rose-500/10 text-rose-600 border-rose-500/20";
      default:
        return "";
    }
  };

  if (loading) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-[#1C1917] mr-3" />
          <span className="text-sm font-medium text-muted-foreground">
            Chargement de la fiche immobilisation...
          </span>
        </div>
      </PageContainer>
    );
  }

  if (!item) {
    return (
      <PageContainer>
        <div className="p-8 text-center space-y-4">
          <h2 className="text-lg font-bold text-destructive">Immobilisation non trouvée</h2>
          <Button onClick={() => router.push("/immobilisations")}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Retour à la liste
          </Button>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-5 mb-6 print:hidden">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push("/immobilisations")}
            className="h-9 px-3"
          >
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            Retour
          </Button>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold tracking-tight">
                {item.designation}
              </h1>
              <span className="font-mono text-xs px-2.5 py-0.5 rounded-md bg-[#FAF8F2] border border-[#E0DACB] font-bold text-[#1C1917]">
                {item.code_inventaire}
              </span>
              <Badge variant="outline" className={getEtatColor(item.etat)}>
                {item.etat_display || item.etat}
              </Badge>
              <Badge variant="secondary">
                {item.statut_display || item.statut}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
              <span>Emplacement Actuel :</span>
              <span className="font-bold text-foreground flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-primary" />
                {item.emplacement_actuel_nom || "Non assigné"}
              </span>
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            onClick={handleDownloadPDF}
            className="flex items-center gap-2 bg-white shadow-2xs hover:bg-[#FAF8F2]"
            title="Télécharger la fiche d'immobilisation en PDF"
          >
            <Download className="w-4 h-4 text-[#1C1917]" />
            <span>Télécharger PDF (Fiche Immobilisation)</span>
          </Button>

          <Button
            variant="outline"
            onClick={() => setIsEditModalOpen(true)}
            className="flex items-center gap-2 bg-white hover:bg-[#FAF8F2]"
          >
            <Edit className="w-4 h-4 text-[#1C1917]" />
            <span>Éditer</span>
          </Button>
        </div>
      </div>

      {/* Main Print Header (Visible ONLY during printing/PDF export) */}
      <div className="hidden print:block border-b-2 border-black pb-4 mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-black tracking-tight uppercase">FICHE D'IMMOBILISATION</h1>
            <p className="text-xs font-semibold text-gray-700 mt-0.5">GestImmo — Plateforme de Gestion des Actifs & Inventaires</p>
          </div>
          <div className="flex items-center gap-4">
            {item.qr_code_base64 && (
              <img
                src={item.qr_code_base64.startsWith("data:") ? item.qr_code_base64 : `data:image/png;base64,${item.qr_code_base64}`}
                alt={`QR Code ${item.code_inventaire}`}
                className="w-16 h-16 object-contain border border-black p-0.5"
              />
            )}
            <div className="text-right text-xs text-gray-700 space-y-0.5">
              <div><strong>Code Inventaire :</strong> <span className="font-mono text-black font-bold">{item.code_inventaire}</span></div>
              <div><strong>Statut :</strong> {item.statut_display || item.statut} | <strong>État :</strong> {item.etat_display || item.etat}</div>
              <div><strong>Date d'Édition :</strong> {new Date().toLocaleDateString("fr-FR")}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex space-x-2 border-b mb-6 pb-2 print:hidden">
        <button
          onClick={() => setActiveTab("infos")}
          className={`px-4 py-2 text-sm font-medium rounded-t-md transition-colors flex items-center gap-2 ${
            activeTab === "infos"
              ? "bg-primary text-primary-foreground border-b-2 border-primary"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Boxes className="w-4 h-4" />
          <span>Informations Générales</span>
        </button>
        <button
          onClick={() => setActiveTab("historique")}
          className={`px-4 py-2 text-sm font-medium rounded-t-md transition-colors flex items-center gap-2 ${
            activeTab === "historique"
              ? "bg-primary text-primary-foreground border-b-2 border-primary"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <History className="w-4 h-4" />
          <span>Historique des Emplacements ({mouvements.length})</span>
        </button>
      </div>

      {/* Tab 1: General Info */}
      {activeTab === "infos" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="md:col-span-2 border shadow-2xs">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary" />
                <span>Spécifications & Propriétés</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-3 bg-muted/20 border rounded-xl space-y-1">
                  <span className="text-muted-foreground block text-[11px]">Code Inventaire</span>
                  <span className="font-mono font-bold text-sm text-primary">{item.code_inventaire}</span>
                </div>
                <div className="p-3 bg-muted/20 border rounded-xl space-y-1">
                  <span className="text-muted-foreground block text-[11px]">Désignation</span>
                  <span className="font-semibold text-sm text-foreground">{item.designation}</span>
                </div>
                <div className="p-3 bg-muted/20 border rounded-xl space-y-1">
                  <span className="text-muted-foreground block text-[11px]">Famille d'équipement</span>
                  <span className="font-semibold text-foreground">{item.famille_nom || "Non spécifiée"}</span>
                </div>
                <div className="p-3 bg-muted/20 border rounded-xl space-y-1">
                  <span className="text-muted-foreground block text-[11px]">Emplacement Actuel</span>
                  <span className="font-bold text-foreground">{item.emplacement_actuel_nom || "Non assigné"}</span>
                </div>
                <div className="p-3 bg-muted/20 border rounded-xl space-y-1">
                  <span className="text-muted-foreground block text-[11px]">Fournisseur</span>
                  <span className="font-semibold text-foreground">{item.fournisseur || "Non renseigné"}</span>
                </div>
                <div className="p-3 bg-muted/20 border rounded-xl space-y-1">
                  <span className="text-muted-foreground block text-[11px]">N° de Série</span>
                  <span className="font-mono font-semibold text-foreground">{item.numero_serie || "Non renseigné"}</span>
                </div>
                <div className="p-3 bg-muted/20 border rounded-xl space-y-1">
                  <span className="text-muted-foreground block text-[11px]">Valeur d'Acquisition</span>
                  <span className="font-bold text-sm text-emerald-600 dark:text-emerald-400">
                    {item.valeur_acquisition ? `${Number(item.valeur_acquisition).toLocaleString("fr-FR", { minimumFractionDigits: 2 })} DT` : "0.00 DT"}
                  </span>
                </div>
                <div className="p-3 bg-muted/20 border rounded-xl space-y-1">
                  <span className="text-muted-foreground block text-[11px]">Entreprise</span>
                  <span className="font-semibold text-foreground">{item.entreprise_nom || "Entreprise Principale"}</span>
                </div>
              </div>

              {item.description && (
                <div className="pt-3 border-t">
                  <span className="text-muted-foreground block text-[11px] mb-1">Description / Observations :</span>
                  <p className="text-xs text-foreground bg-muted/30 p-3 rounded-xl border leading-relaxed">
                    {item.description}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Location & Status Card */}
          <div className="space-y-6">
            <Card className="border shadow-2xs">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-primary" />
                  <span>Position Actuelle</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-xs">
                <div className="p-4 bg-[#FAF8F2] border border-[#E0DACB] rounded-2xl text-center space-y-2">
                  <MapPin className="w-8 h-8 text-[#1C1917] mx-auto" />
                  <div className="text-sm font-bold text-[#1C1917]">
                    {item.emplacement_actuel_nom || "Aucun emplacement assigné"}
                  </div>
                  <Button
                    onClick={handleOpenTransferModal}
                    size="sm"
                    className="w-full text-xs h-8 bg-[#1C1917] hover:bg-[#332E2B] text-white flex items-center justify-center gap-1.5 mt-2"
                  >
                    <ArrowRightLeft className="w-3.5 h-3.5" />
                    <span>Transférer le bien</span>
                  </Button>
                </div>

                <div className="text-[11px] text-muted-foreground text-center">
                  Le transfert crée un historique complet consultable sous l'onglet dédié.
                </div>
              </CardContent>
            </Card>

            {/* QR Code Tag Card */}
            <Card className="border shadow-2xs">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <QrCode className="w-4 h-4 text-primary" />
                  <span>Étiquette QR Code</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-xs text-center">
                {item.qr_code_base64 ? (
                  <div className="p-4 bg-white border rounded-2xl flex flex-col items-center space-y-3">
                    <img
                      src={item.qr_code_base64.startsWith("data:") ? item.qr_code_base64 : `data:image/png;base64,${item.qr_code_base64}`}
                      alt={`QR Code ${item.code_inventaire}`}
                      className="w-40 h-40 object-contain rounded-lg border p-2 bg-white shadow-xs"
                    />
                    <div className="font-mono font-bold text-sm text-[#1C1917] tracking-wider">
                      {item.code_inventaire}
                    </div>
                    <Button
                      onClick={handleDownloadQrCode}
                      size="sm"
                      variant="outline"
                      className="w-full text-xs h-8 flex items-center justify-center gap-1.5"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Télécharger l'étiquette</span>
                    </Button>
                  </div>
                ) : (
                  <div className="p-4 bg-muted/20 border border-dashed rounded-xl text-muted-foreground">
                    Génération du QR Code en cours...
                  </div>
                )}
                <p className="text-[11px] text-muted-foreground">
                  Scanner avec l'application mobile ou la caméra de l'appareil pour ouvrir instantanément cette fiche.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Tab 2: Location Transfer History Timeline & Table */}
      {activeTab === "historique" && (
        <Card className="border shadow-2xs">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <History className="w-5 h-5 text-primary" />
              <span>Historique des Transferts d'Emplacement</span>
            </CardTitle>
            <Button
              onClick={handleOpenTransferModal}
              size="sm"
              className="bg-[#1C1917] hover:bg-[#332E2B] text-white text-xs flex items-center gap-1.5"
            >
              <ArrowRightLeft className="w-3.5 h-3.5" />
              <span>Nouveau transfert</span>
            </Button>
          </CardHeader>
          <CardContent>
            {mouvements.length === 0 ? (
              <div className="p-8 text-center text-xs text-muted-foreground border border-dashed rounded-xl space-y-3">
                <History className="w-8 h-8 text-muted-foreground mx-auto" />
                <p className="font-semibold text-foreground">Aucun mouvement d'emplacement enregistré</p>
                <p className="max-w-sm mx-auto text-muted-foreground">
                  Lorsque cet équipement est transféré vers un nouvel emplacement, l'historique complet s'affiche ici.
                </p>
                <Button onClick={handleOpenTransferModal} size="sm" variant="outline">
                  Effectuer un premier transfert
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="border-b bg-muted/40 font-semibold text-muted-foreground">
                      <th className="py-3 px-4">Ancien Emplacement</th>
                      <th className="py-3 px-4"></th>
                      <th className="py-3 px-4">Nouvel Emplacement</th>
                      <th className="py-3 px-4">Date du Transfert</th>
                      <th className="py-3 px-4">Responsable</th>
                      <th className="py-3 px-4">Utilisateur Concerné</th>
                      <th className="py-3 px-4">Motif & Remarques</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mouvements.map((m) => (
                      <tr key={m.id} className="border-b hover:bg-muted/20 transition-colors">
                        <td className="py-3 px-4 font-semibold text-muted-foreground">
                          {m.ancien_emplacement_nom || "Origine / Non spécifié"}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <ArrowRightLeft className="w-3.5 h-3.5 text-primary inline-block" />
                        </td>
                        <td className="py-3 px-4 font-bold text-foreground">
                          {m.nouvel_emplacement_nom || "Inconnu"}
                        </td>
                        <td className="py-3 px-4 font-medium text-muted-foreground">
                          {new Date(m.date_transfert).toLocaleString("fr-FR")}
                        </td>
                        <td className="py-3 px-4 font-medium">
                          {m.responsable_transfert_nom || "-"}
                        </td>
                        <td className="py-3 px-4 font-medium text-muted-foreground">
                          {m.utilisateur_concerne_nom || "-"}
                        </td>
                        <td className="py-3 px-4 text-muted-foreground">
                          {m.motif && <span className="font-semibold text-foreground block">{m.motif}</span>}
                          {m.commentaire && <span className="text-[11px] block">{m.commentaire}</span>}
                          {!m.motif && !m.commentaire && "-"}
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

      {/* Print-only section for Location Transfer History when in PDF/Print mode */}
      <div className="hidden print:block mt-6">
        <h3 className="text-sm font-bold text-black border-b pb-2 mb-3 uppercase">Historique des Transferts d'Emplacement</h3>
        {mouvements.length === 0 ? (
          <p className="text-xs text-gray-500 italic">Aucun mouvement d'emplacement enregistré.</p>
        ) : (
          <table className="w-full text-xs text-left border-collapse border border-gray-300">
            <thead>
              <tr className="bg-gray-100 font-bold border-b border-gray-300">
                <th className="py-2 px-3 border-r">Ancien Emplacement</th>
                <th className="py-2 px-3 border-r">Nouvel Emplacement</th>
                <th className="py-2 px-3 border-r">Date du Transfert</th>
                <th className="py-2 px-3 border-r">Responsable</th>
                <th className="py-2 px-3">Motif & Remarques</th>
              </tr>
            </thead>
            <tbody>
              {mouvements.map((m) => (
                <tr key={m.id} className="border-b border-gray-200">
                  <td className="py-2 px-3 border-r">{m.ancien_emplacement_nom || "Origine"}</td>
                  <td className="py-2 px-3 border-r font-bold">{m.nouvel_emplacement_nom || "Inconnu"}</td>
                  <td className="py-2 px-3 border-r">{new Date(m.date_transfert).toLocaleString("fr-FR")}</td>
                  <td className="py-2 px-3 border-r">{m.responsable_transfert_nom || "-"}</td>
                  <td className="py-2 px-3">{m.motif || m.commentaire || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal: Transférer l'emplacement */}
      {isTransferModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-background rounded-lg shadow-xl max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center gap-3 pb-3 border-b">
              <div className="p-2 bg-[#FAF8F2] border border-[#E0DACB] rounded-xl">
                <ArrowRightLeft className="w-5 h-5 text-[#1C1917]" />
              </div>
              <div>
                <h2 className="text-base font-bold text-foreground">
                  Transférer l'immobilisation
                </h2>
                <p className="text-xs text-muted-foreground">
                  Bien : <strong className="text-foreground">{item.code_inventaire}</strong> - {item.designation}
                </p>
              </div>
            </div>

            {transferError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl font-medium">
                {transferError}
              </div>
            )}

            <form onSubmit={handleExecuteTransfer} className="space-y-4">
              {/* Emplacement Actuel Read-only */}
              <div className="p-3 bg-muted/30 border rounded-xl text-xs space-y-1">
                <span className="text-muted-foreground block text-[11px]">Emplacement Actuel (Ancien)</span>
                <span className="font-bold text-foreground">
                  {item.emplacement_actuel_nom || "Non assigné"}
                </span>
              </div>

              {/* Nouvel Emplacement Selector */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-foreground block">
                  Nouvel Emplacement *
                </label>
                <select
                  value={nouvelEmplacementId}
                  onChange={(e) => setNouvelEmplacementId(e.target.value)}
                  required
                  className="w-full h-10 px-3 border rounded-xl bg-background text-xs font-medium focus:border-primary outline-none"
                >
                  <option value="">-- Sélectionner un nouvel emplacement --</option>
                  {emplacements
                    .filter((emp) => emp.id !== item.emplacement_actuel)
                    .map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.nom_emplacement} ({emp.code_emplacement}) - {emp.type_display || emp.type}
                      </option>
                    ))}
                </select>
              </div>

              {/* Utilisateur Concerné */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-foreground block">
                  Utilisateur Concerné (Optionnel)
                </label>
                <select
                  value={utilisateurConcerneId}
                  onChange={(e) => setUtilisateurConcerneId(e.target.value)}
                  className="w-full h-10 px-3 border rounded-xl bg-background text-xs font-medium focus:border-primary outline-none"
                >
                  <option value="">-- Sélectionner un utilisateur --</option>
                  {usersList.map((u) => {
                    const name = u.first_name && u.last_name ? `${u.first_name} ${u.last_name}` : u.username;
                    return (
                      <option key={u.id} value={u.id}>
                        {name} ({u.username})
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Motif */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-foreground block">
                  Motif du transfert (Optionnel)
                </label>
                <Input
                  placeholder="Ex: Réaffectation de bureau, Travaux de rénovation..."
                  value={motifTransfert}
                  onChange={(e) => setMotifTransfert(e.target.value)}
                  className="text-xs h-9"
                />
              </div>

              {/* Commentaire */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-foreground block">
                  Commentaires / Remarques (Optionnel)
                </label>
                <textarea
                  placeholder="Notes complémentaires sur l'état ou la livraison..."
                  value={commentaireTransfert}
                  onChange={(e) => setCommentaireTransfert(e.target.value)}
                  className="w-full border rounded-xl p-2.5 text-xs bg-background outline-none focus:border-primary"
                  rows={2}
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <Button type="button" variant="outline" onClick={() => setIsTransferModalOpen(false)}>
                  Annuler
                </Button>
                <Button type="submit" disabled={transferring} className="bg-[#1C1917] hover:bg-[#332E2B] text-white">
                  {transferring ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-1" />
                  ) : (
                    <Check className="w-4 h-4 mr-1" />
                  )}
                  <span>Valider le Transfert</span>
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Modifier l'immobilisation */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-background rounded-lg shadow-xl max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold">Modifier l'immobilisation</h2>
            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold block mb-1">Code Inventaire *</label>
                  <Input value={codeInventaire} onChange={(e) => setCodeInventaire(e.target.value)} required />
                </div>
                <div>
                  <label className="text-xs font-bold block mb-1">Désignation *</label>
                  <Input value={designation} onChange={(e) => setDesignation(e.target.value)} required />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold block mb-1">Famille</label>
                  <select
                    className="w-full border rounded-md px-3 py-2 text-xs bg-background"
                    value={familleId}
                    onChange={(e) => setFamilleId(e.target.value)}
                  >
                    <option value="">-- Sélectionner une famille --</option>
                    {familles.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.nom} ({f.code})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold block mb-1">Fournisseur</label>
                  <Input value={fournisseur} onChange={(e) => setFournisseur(e.target.value)} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold block mb-1">N° de Série</label>
                  <Input value={numeroSerie} onChange={(e) => setNumeroSerie(e.target.value)} />
                </div>
                <div>
                  <label className="text-xs font-bold block mb-1">Valeur d'Acquisition (DT)</label>
                  <Input type="number" step="0.01" value={valeurAcquisition} onChange={(e) => setValeurAcquisition(e.target.value)} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold block mb-1">État</label>
                  <select
                    className="w-full border rounded-md px-3 py-2 text-xs bg-background"
                    value={etat}
                    onChange={(e) => setEtat(e.target.value as EtatImmobilisation)}
                  >
                    <option value="neuf">Neuf</option>
                    <option value="bon">Bon</option>
                    <option value="moyen">Moyen</option>
                    <option value="mauvais">Mauvais</option>
                    <option value="hors_service">Hors Service</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold block mb-1">Statut</label>
                  <select
                    className="w-full border rounded-md px-3 py-2 text-xs bg-background"
                    value={statut}
                    onChange={(e) => setStatut(e.target.value as StatutImmobilisation)}
                  >
                    <option value="en_service">En Service</option>
                    <option value="en_maintenance">En Maintenance</option>
                    <option value="reforme">Réformé</option>
                    <option value="cede">Cédé</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold block mb-1">Description / Notes</label>
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
