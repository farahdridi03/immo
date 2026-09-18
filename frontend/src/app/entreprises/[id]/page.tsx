"use client";

import React, { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Building2,
  FolderTree,
  Plus,
  Pencil,
  Trash2,
  Mail,
  Phone,
  MapPin,
  Calendar,
  CheckCircle2,
  Clock,
  XCircle,
  Briefcase,
  Hash,
} from "lucide-react";
import { PageContainer } from "@/components/layout/PageContainer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { entreprisesApi, departementsApi, usersApi } from "@/services/api/users";
import type { Entreprise, Departement, Utilisateur } from "@/types/api";

export default function EntrepriseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const entrepriseId = Number(resolvedParams.id);
  const router = useRouter();

  const [entreprise, setEntreprise] = useState<Entreprise | null>(null);
  const [departements, setDepartements] = useState<Departement[]>([]);
  const [usersList, setUsersList] = useState<Utilisateur[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingDepts, setLoadingDepts] = useState(true);

  // Edit Enterprise Modal state
  const [isEditEntrepriseOpen, setIsEditEntrepriseOpen] = useState(false);
  const [editNom, setEditNom] = useState("");
  const [editMatricule, setEditMatricule] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editTelephone, setEditTelephone] = useState("");
  const [editSecteur, setEditSecteur] = useState("");
  const [editAdresse, setEditAdresse] = useState("");
  const [editLogo, setEditLogo] = useState("");

  // Department Modal state (Add / Edit)
  const [isDeptModalOpen, setIsDeptModalOpen] = useState(false);
  const [editingDeptId, setEditingDeptId] = useState<number | null>(null);
  const [deptNom, setDeptNom] = useState("");
  const [deptActif, setDeptActif] = useState(true);
  const [deptResponsable, setDeptResponsable] = useState<number | "">("");

  const loadUsers = async () => {
    try {
      const data = await usersApi.list({ entreprise: entrepriseId.toString() });
      if (Array.isArray(data)) {
        setUsersList(data);
      }
    } catch (err) {
      console.error("Failed to load users", err);
    }
  };

  const loadEntreprise = async () => {
    setLoading(true);
    try {
      const data = await entreprisesApi.get(entrepriseId);
      setEntreprise(data);
      if (data) {
        setEditNom(data.nom || "");
        setEditMatricule(data.matricule_fiscal || "");
        setEditEmail(data.email || "");
        setEditTelephone(data.telephone || "");
        setEditSecteur(data.secteur_activite || "");
        setEditAdresse(data.adresse || "");
        setEditLogo(data.logo || "");
      }
    } catch (err) {
      console.error("Failed to load entreprise", err);
    } finally {
      setLoading(false);
    }
  };

  const loadDepartements = async () => {
    setLoadingDepts(true);
    try {
      const data = await departementsApi.list({ entreprise: entrepriseId.toString() });
      if (Array.isArray(data)) {
        setDepartements(data);
      }
    } catch (err) {
      console.error("Failed to load departements", err);
    } finally {
      setLoadingDepts(false);
    }
  };

  useEffect(() => {
    if (entrepriseId) {
      loadEntreprise();
      loadDepartements();
      loadUsers();
    }
  }, [entrepriseId]);

  // Handle Enterprise Update
  const handleSaveEntreprise = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!entreprise) return;
    try {
      const payload: Partial<Entreprise> = {
        nom: editNom,
        matricule_fiscal: editMatricule || null,
        email: editEmail,
        telephone: editTelephone,
        secteur_activite: editSecteur,
        adresse: editAdresse,
      };
      if (editLogo && editLogo.startsWith("data:image")) {
        payload.logo = editLogo;
      }
      const updated = await entreprisesApi.update(entreprise.id, payload);
      setEntreprise(updated);
      setIsEditEntrepriseOpen(false);
    } catch (err) {
      console.error("Error updating enterprise:", err);
    }
  };

  // Handle Enterprise Delete
  const handleDeleteEntreprise = async () => {
    if (!entreprise) return;
    if (confirm(`Êtes-vous sûr de vouloir supprimer l'entreprise "${entreprise.nom}" ?`)) {
      try {
        await entreprisesApi.delete(entreprise.id);
        router.push("/entreprises");
      } catch (err) {
        console.error("Error deleting enterprise:", err);
      }
    }
  };

  // Open Department Modal for Create
  const handleOpenAddDept = () => {
    setEditingDeptId(null);
    setDeptNom("");
    setDeptActif(true);
    setDeptResponsable("");
    setIsDeptModalOpen(true);
  };

  // Open Department Modal for Edit
  const handleOpenEditDept = (dept: Departement) => {
    setEditingDeptId(dept.id);
    setDeptNom(dept.nom);
    setDeptActif(dept.actif);
    setDeptResponsable(dept.responsable || "");
    setIsDeptModalOpen(true);
  };

  // Handle Department Save (Create or Update)
  const handleSaveDept = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deptNom.trim()) return;

    try {
      const deptPayload: Partial<Departement> = {
        nom: deptNom,
        actif: deptActif,
        entreprise: entrepriseId,
        responsable: deptResponsable === "" ? null : Number(deptResponsable),
      };

      if (editingDeptId) {
        await departementsApi.update(editingDeptId, deptPayload);
      } else {
        await departementsApi.create(deptPayload);
      }
      setIsDeptModalOpen(false);
      loadDepartements();
      loadEntreprise();
    } catch (err) {
      console.error("Error saving department:", err);
    }
  };

  // Handle Department Delete
  const handleDeleteDept = async (id: number, nom: string) => {
    if (confirm(`Supprimer le département "${nom}" ?`)) {
      try {
        await departementsApi.delete(id);
        loadDepartements();
        loadEntreprise();
      } catch (err) {
        console.error("Error deleting department:", err);
      }
    }
  };

  if (loading) {
    return (
      <PageContainer>
        <div className="py-12 text-center text-muted-foreground">
          Chargement des détails de l'entreprise...
        </div>
      </PageContainer>
    );
  }

  if (!entreprise) {
    return (
      <PageContainer>
        <div className="py-12 text-center space-y-4">
          <div className="text-[#DC2626] font-semibold text-lg">Entreprise introuvable</div>
          <Link href="/entreprises">
            <Button variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" /> Retour à la liste
            </Button>
          </Link>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="space-y-6">
        {/* Top Breadcrumb Navigation */}
        <div className="flex items-center gap-2">
          <Link
            href="/entreprises"
            className="inline-flex items-center gap-2 text-xs font-medium text-[#78716C] hover:text-[#1C1917] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Retour aux entreprises</span>
          </Link>
        </div>

        {/* Enterprise Header Section */}
        <div className="bg-white rounded-2xl border border-[#E0DACB] p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="h-14 w-14 rounded-2xl bg-[#EAE3CE] text-[#1C1917] font-bold flex items-center justify-center text-2xl shrink-0 shadow-xs border border-[#E0DACB] overflow-hidden p-1">
              {entreprise.logo ? (
                <img src={entreprise.logo} alt={entreprise.nom} className="w-full h-full object-contain rounded-xl" />
              ) : (
                <Building2 className="w-7 h-7 text-[#1C1917]" />
              )}
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-bold text-[#1C1917] tracking-tight">{entreprise.nom}</h1>
                {entreprise.statut_validation === "approuve" && (
                  <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">
                    <CheckCircle2 className="w-3 h-3 mr-1" /> Approuvé
                  </Badge>
                )}
                {entreprise.statut_validation === "en_attente" && (
                  <Badge className="bg-amber-50 text-amber-700 border-amber-200">
                    <Clock className="w-3 h-3 mr-1" /> En attente
                  </Badge>
                )}
                {entreprise.statut_validation === "rejete" && (
                  <Badge className="bg-rose-50 text-rose-700 border-rose-200">
                    <XCircle className="w-3 h-3 mr-1" /> Rejeté
                  </Badge>
                )}
                <Badge variant={entreprise.actif ? "default" : "secondary"}>
                  {entreprise.actif ? "Actif" : "Inactif"}
                </Badge>
              </div>

              <div className="flex items-center gap-4 text-xs text-[#78716C] flex-wrap pt-1">
                {entreprise.secteur_activite && (
                  <div className="flex items-center gap-1.5">
                    <Briefcase className="w-3.5 h-3.5" />
                    <span>{entreprise.secteur_activite}</span>
                  </div>
                )}
                {entreprise.matricule_fiscal && (
                  <div className="flex items-center gap-1.5">
                    <Hash className="w-3.5 h-3.5" />
                    <span className="font-mono">{entreprise.matricule_fiscal}</span>
                  </div>
                )}
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Créé le {new Date(entreprise.date_creation).toLocaleDateString("fr-FR")}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              onClick={handleOpenAddDept}
              className="bg-[#1C1917] text-white hover:bg-[#332F2C] shadow-xs"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              Ajouter un département
            </Button>
            <Button variant="outline" onClick={() => router.push(`/entreprises/${entrepriseId}/editer`)}>
              <Pencil className="w-4 h-4 mr-1.5" />
              Modifier
            </Button>
            <Button variant="destructive" onClick={handleDeleteEntreprise}>
              <Trash2 className="w-4 h-4 mr-1.5" />
              Supprimer
            </Button>
          </div>
        </div>

        {/* Info Grid Card */}
        <Card className="bg-white border-[#E0DACB]">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold text-[#1C1917]">Informations Générales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
              <div className="p-3.5 rounded-xl bg-[#FAF8F2] border border-[#E0DACB]/60 space-y-1">
                <span className="text-[#78716C] font-medium flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5" /> Adresse E-mail
                </span>
                <p className="font-semibold text-[#1C1917] truncate">{entreprise.email || "Non renseigné"}</p>
              </div>

              <div className="p-3.5 rounded-xl bg-[#FAF8F2] border border-[#E0DACB]/60 space-y-1">
                <span className="text-[#78716C] font-medium flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5" /> Téléphone
                </span>
                <p className="font-semibold text-[#1C1917] truncate">{entreprise.telephone || "Non renseigné"}</p>
              </div>

              <div className="p-3.5 rounded-xl bg-[#FAF8F2] border border-[#E0DACB]/60 space-y-1">
                <span className="text-[#78716C] font-medium flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5" /> Adresse Physique
                </span>
                <p className="font-semibold text-[#1C1917] truncate">{entreprise.adresse || "Non renseignée"}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Departments List Section */}
        <Card className="bg-white border-[#E0DACB]">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div className="flex items-center gap-2">
              <FolderTree className="w-5 h-5 text-[#78716C]" />
              <CardTitle className="text-lg font-bold text-[#1C1917]">
                Départements liés ({departements.length})
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {loadingDepts ? (
              <div className="py-8 text-center text-xs text-[#78716C]">Chargement des départements...</div>
            ) : departements.length === 0 ? (
              <div className="py-8 text-center text-xs text-[#78716C]">
                <p>Aucun département n'est encore lié à cette entreprise.</p>
              </div>
            ) : (
              <div className="relative overflow-x-auto">
                <table className="w-full text-sm text-left border-collapse">
                  <thead className="bg-[#FAF8F2] text-[#78716C] uppercase text-xs border-b border-[#E0DACB]">
                    <tr>
                      <th className="px-4 py-3">Nom du Département</th>
                      <th className="px-4 py-3">Responsable</th>
                      <th className="px-4 py-3">Date de création</th>
                      <th className="px-4 py-3">Statut</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E0DACB]/50">
                    {departements.map((dept) => (
                      <tr key={dept.id} className="hover:bg-[#FAF8F2]/60 transition-colors">
                        <td className="px-4 py-3 font-semibold text-[#1C1917] flex items-center gap-2">
                          <FolderTree className="w-4 h-4 text-[#78716C]" />
                          <span>{dept.nom}</span>
                        </td>
                        <td className="px-4 py-3 text-xs text-[#57534E]">
                          {dept.responsable_nom || "Non assigné"}
                        </td>
                        <td className="px-4 py-3 text-xs text-[#78716C]">
                          {new Date(dept.date_creation).toLocaleDateString("fr-FR")}
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={dept.actif ? "default" : "secondary"}>
                            {dept.actif ? "Actif" : "Inactif"}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                              onClick={() => handleOpenEditDept(dept)}
                              title="Éditer"
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                              onClick={() => handleDeleteDept(dept.id, dept.nom)}
                              title="Supprimer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
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

      {/* Add / Edit Department Modal */}
      {isDeptModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4 border border-[#E0DACB]">
            <h2 className="text-lg font-bold text-[#1C1917]">
              {editingDeptId ? "Modifier le Département" : "Nouveau Département"}
            </h2>
            <form onSubmit={handleSaveDept} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-[#78716C]">Nom du Département *</label>
                <Input
                  value={deptNom}
                  onChange={(e) => setDeptNom(e.target.value)}
                  placeholder="ex: Ressources Humaines, Finance..."
                  required
                />
              </div>

              <div>
                <label className="text-xs font-medium text-[#78716C]">Responsable du Département</label>
                <select
                  value={deptResponsable}
                  onChange={(e) => setDeptResponsable(e.target.value ? Number(e.target.value) : "")}
                  className="w-full h-9 px-3 rounded-lg border border-[#E0DACB] bg-white text-xs text-[#1C1917] focus:outline-none focus:ring-2 focus:ring-[#1C1917] mt-1"
                >
                  <option value="">-- Aucun responsable --</option>
                  {usersList.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.first_name || u.last_name ? `${u.first_name} ${u.last_name}` : u.username} ({u.email || u.username})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="deptActif"
                  checked={deptActif}
                  onChange={(e) => setDeptActif(e.target.checked)}
                  className="rounded border-gray-300 text-[#1C1917] focus:ring-[#1C1917]"
                />
                <label htmlFor="deptActif" className="text-xs text-[#1C1917] font-medium">
                  Département actif
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDeptModalOpen(false)}
                >
                  Annuler
                </Button>
                <Button type="submit" className="bg-[#1C1917] text-white">
                  {editingDeptId ? "Enregistrer" : "Créer"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
