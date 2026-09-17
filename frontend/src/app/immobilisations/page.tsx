"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PageContainer } from "@/components/layout/PageContainer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  emplacementsApi,
  famillesApi,
  immobilisationsApi,
} from "@/services/api/immobilisations";
import type {
  Emplacement,
  EtatImmobilisation,
  Famille,
  Immobilisation,
  StatutImmobilisation,
} from "@/types/api";

export default function ImmobilisationsPage() {
  const router = useRouter();
  const [items, setItems] = useState<Immobilisation[]>([]);
  const [familles, setFamilles] = useState<Famille[]>([]);
  const [emplacements, setEmplacements] = useState<Emplacement[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  // Form states
  const [codeInventaire, setCodeInventaire] = useState("");
  const [designation, setDesignation] = useState("");
  const [description, setDescription] = useState("");
  const [famille, setFamille] = useState<number | "">("");
  const [emplacementActuel, setEmplacementActuel] = useState<number | "">("");
  const [fournisseur, setFournisseur] = useState("");
  const [numeroSerie, setNumeroSerie] = useState("");
  const [valeurAcquisition, setValeurAcquisition] = useState("");
  const [etat, setEtat] = useState<EtatImmobilisation>("neuf");
  const [statut, setStatut] = useState<StatutImmobilisation>("en_service");

  const loadData = async () => {
    setLoading(true);
    try {
      const [resImmo, resFam, resEmp] = await Promise.all([
        immobilisationsApi.list(search ? { search } : undefined),
        famillesApi.list(),
        emplacementsApi.list(),
      ]);
      if (Array.isArray(resImmo)) setItems(resImmo);
      if (Array.isArray(resFam)) setFamilles(resFam);
      if (Array.isArray(resEmp)) setEmplacements(resEmp);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [search]);

  const handleOpenCreate = () => {
    setEditingId(null);
    setCodeInventaire("");
    setDesignation("");
    setDescription("");
    setFamille("");
    setEmplacementActuel("");
    setFournisseur("");
    setNumeroSerie("");
    setValeurAcquisition("");
    setEtat("neuf");
    setStatut("en_service");
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: Immobilisation) => {
    setEditingId(item.id);
    setCodeInventaire(item.code_inventaire);
    setDesignation(item.designation);
    setDescription(item.description || "");
    setFamille(item.famille || "");
    setEmplacementActuel(item.emplacement_actuel || "");
    setFournisseur(item.fournisseur || "");
    setNumeroSerie(item.numero_serie || "");
    setValeurAcquisition(item.valeur_acquisition ? String(item.valeur_acquisition) : "");
    setEtat(item.etat);
    setStatut(item.statut);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload: Partial<Immobilisation> = {
        code_inventaire: codeInventaire,
        designation,
        description,
        famille: famille ? Number(famille) : null,
        emplacement_actuel: emplacementActuel ? Number(emplacementActuel) : null,
        fournisseur,
        numero_serie: numeroSerie,
        valeur_acquisition: valeurAcquisition ? parseFloat(valeurAcquisition) : null,
        etat,
        statut,
      };

      if (editingId) {
        await immobilisationsApi.update(editingId, payload);
      } else {
        await immobilisationsApi.create(payload);
      }
      setIsModalOpen(false);
      loadData();
    } catch (err: any) {
      console.error("Error saving immobilisation:", err);
      alert(err?.message || "Erreur lors de l'enregistrement de l'immobilisation.");
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm("Voulez-vous supprimer cette immobilisation ?")) {
      try {
        await immobilisationsApi.delete(id);
        loadData();
      } catch (err) {
        alert("Erreur de suppression.");
      }
    }
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

  return (
    <PageContainer>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Gestion des Immobilisations</h1>
            <p className="text-muted-foreground">
              Suivi du parc d'équipements, matériels et actifs physiques.
            </p>
          </div>
          <Button onClick={handleOpenCreate} className="shadow-md">
            + Nouvelle Immobilisation
          </Button>
        </div>

        <div className="flex items-center gap-4">
          <Input
            placeholder="Rechercher code inventaire, désignation, N° série..."
            value={search}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
            className="max-w-sm"
          />
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-medium">Liste des Actifs ({items.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="py-8 text-center text-muted-foreground">Chargement en cours...</div>
            ) : items.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">Aucune immobilisation trouvée.</div>
            ) : (
              <div className="relative overflow-x-auto">
                <table className="w-full text-sm text-left border-collapse">
                  <thead className="bg-muted/50 text-muted-foreground uppercase text-xs">
                    <tr>
                      <th className="px-4 py-3">Code Inventaire</th>
                      <th className="px-4 py-3">Désignation</th>
                      <th className="px-4 py-3">Famille</th>
                      <th className="px-4 py-3">Emplacement Actuel</th>
                      <th className="px-4 py-3">État</th>
                      <th className="px-4 py-3">Statut</th>
                      <th className="px-4 py-3">Valeur (DT)</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {items.map((item) => (
                      <tr key={item.id} className="hover:bg-muted/20">
                        <td className="px-4 py-3 font-mono font-bold text-primary">
                          {item.code_inventaire}
                        </td>
                        <td className="px-4 py-3 font-semibold">{item.designation}</td>
                        <td className="px-4 py-3 text-muted-foreground">{item.famille_nom || "-"}</td>
                        <td className="px-4 py-3 font-medium">{item.emplacement_actuel_nom || "Non assigné"}</td>
                        <td className="px-4 py-3">
                          <Badge variant="outline" className={getEtatColor(item.etat)}>
                            {item.etat_display || item.etat}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="secondary">
                            {item.statut_display || item.statut}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 font-mono font-medium">
                          {item.valeur_acquisition ? `${item.valeur_acquisition} DT` : "-"}
                        </td>
                        <td className="px-4 py-3 text-right space-x-2">
                          <Button size="sm" variant="outline" onClick={() => router.push(`/immobilisations/${item.id}`)}>
                            Voir
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => handleOpenEdit(item)}>
                            Éditer
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => handleDelete(item.id)}>
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
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-background rounded-lg shadow-xl w-full max-w-xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold">
              {editingId ? "Modifier l'immobilisation" : "Créer une immobilisation"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Code Inventaire</label>
                  <Input
                    value={codeInventaire}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCodeInventaire(e.target.value)}
                    required
                    placeholder="Ex: INV-2026-001"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Désignation</label>
                  <Input
                    value={designation}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDesignation(e.target.value)}
                    required
                    placeholder="Ex: Serveur Dell PowerEdge"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Famille</label>
                  <select
                    value={famille}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFamille(e.target.value ? Number(e.target.value) : "")}
                    className="w-full h-10 px-3 border rounded-md bg-background text-sm"
                  >
                    <option value="">Sélectionner une famille</option>
                    {familles.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.nom} ({f.code})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium">Emplacement Actuel</label>
                  <select
                    value={emplacementActuel}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                      setEmplacementActuel(e.target.value ? Number(e.target.value) : "")
                    }
                    className="w-full h-10 px-3 border rounded-md bg-background text-sm"
                  >
                    <option value="">Sélectionner un emplacement</option>
                    {emplacements.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.nom_emplacement} ({emp.code_emplacement})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium">Fournisseur</label>
                  <Input
                    value={fournisseur}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFournisseur(e.target.value)}
                    placeholder="Fournisseur..."
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Numéro de Série</label>
                  <Input
                    value={numeroSerie}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNumeroSerie(e.target.value)}
                    placeholder="N° Série..."
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Valeur d'Acquisition (DT)</label>
                  <Input
                    type="number"
                    step="0.01"
                    value={valeurAcquisition}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setValeurAcquisition(e.target.value)}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">État</label>
                  <select
                    value={etat}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setEtat(e.target.value as EtatImmobilisation)}
                    className="w-full h-10 px-3 border rounded-md bg-background text-sm"
                  >
                    <option value="neuf">Neuf</option>
                    <option value="bon">Bon</option>
                    <option value="moyen">Moyen</option>
                    <option value="mauvais">Mauvais</option>
                    <option value="hors_service">Hors Service</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium">Statut</label>
                  <select
                    value={statut}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setStatut(e.target.value as StatutImmobilisation)}
                    className="w-full h-10 px-3 border rounded-md bg-background text-sm"
                  >
                    <option value="en_service">En Service</option>
                    <option value="en_maintenance">En Maintenance</option>
                    <option value="reforme">Réformé</option>
                    <option value="cede">Cédé</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Description / Notes</label>
                <Input
                  value={description}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDescription(e.target.value)}
                  placeholder="Notes complémentaires..."
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
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
