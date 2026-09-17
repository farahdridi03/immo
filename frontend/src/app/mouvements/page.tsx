"use client";

import React, { useEffect, useState } from "react";
import { PageContainer } from "@/components/layout/PageContainer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  emplacementsApi,
  immobilisationsApi,
  mouvementsEmplacementApi,
} from "@/services/api/immobilisations";
import type { Emplacement, Immobilisation, MouvementEmplacement } from "@/types/api";

export default function MouvementsPage() {
  const [items, setItems] = useState<MouvementEmplacement[]>([]);
  const [immobilisations, setImmobilisations] = useState<Immobilisation[]>([]);
  const [emplacements, setEmplacements] = useState<Emplacement[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form states
  const [selectedImmo, setSelectedImmo] = useState<number | "">("");
  const [nouvelEmplacement, setNouvelEmplacement] = useState<number | "">("");
  const [motif, setMotif] = useState("");
  const [commentaire, setCommentaire] = useState("");

  const loadData = async () => {
    setLoading(true);
    try {
      const [resMouv, resImmo, resEmp] = await Promise.all([
        mouvementsEmplacementApi.list(search ? { search } : undefined),
        immobilisationsApi.list(),
        emplacementsApi.list(),
      ]);
      if (Array.isArray(resMouv)) setItems(resMouv);
      if (Array.isArray(resImmo)) setImmobilisations(resImmo);
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

  const handleOpenTransferModal = () => {
    setSelectedImmo("");
    setNouvelEmplacement("");
    setMotif("");
    setCommentaire("");
    setIsModalOpen(true);
  };

  const handleSubmitTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedImmo || !nouvelEmplacement) {
      alert("Veuillez choisir une immobilisation et un nouvel emplacement.");
      return;
    }
    try {
      await mouvementsEmplacementApi.create({
        immobilisation: Number(selectedImmo),
        nouvel_emplacement: Number(nouvelEmplacement),
        motif,
        commentaire,
      });
      setIsModalOpen(false);
      loadData();
    } catch (err) {
      alert("Erreur lors de la création du mouvement.");
    }
  };

  return (
    <PageContainer>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Historique des Mouvements & Transferts</h1>
            <p className="text-muted-foreground">
              Traçabilité des réaffectations de matériel entre emplacements.
            </p>
          </div>
          <Button onClick={handleOpenTransferModal} className="shadow-md">
            + Nouveau Transfert
          </Button>
        </div>

        <div className="flex items-center gap-4">
          <Input
            placeholder="Rechercher par code inventaire, désignation, motif..."
            value={search}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
            className="max-w-sm"
          />
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-medium">Historique des Transferts ({items.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="py-8 text-center text-muted-foreground">Chargement en cours...</div>
            ) : items.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">Aucun mouvement enregistré.</div>
            ) : (
              <div className="relative overflow-x-auto">
                <table className="w-full text-sm text-left border-collapse">
                  <thead className="bg-muted/50 text-muted-foreground uppercase text-xs">
                    <tr>
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3">Code Inventaire</th>
                      <th className="px-4 py-3">Désignation</th>
                      <th className="px-4 py-3">Ancien Emplacement</th>
                      <th className="px-4 py-3">Nouvel Emplacement</th>
                      <th className="px-4 py-3">Motif</th>
                      <th className="px-4 py-3">Responsable</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {items.map((item) => (
                      <tr key={item.id} className="hover:bg-muted/20">
                        <td className="px-4 py-3 text-muted-foreground whitespace-nowrap font-mono text-xs">
                          {new Date(item.date_transfert).toLocaleString("fr-FR")}
                        </td>
                        <td className="px-4 py-3 font-mono font-semibold">{item.immobilisation_code}</td>
                        <td className="px-4 py-3 font-medium">{item.immobilisation_designation}</td>
                        <td className="px-4 py-3 text-amber-600 font-medium">
                          {item.ancien_emplacement_nom || "Initial / Inconnu"}
                        </td>
                        <td className="px-4 py-3 text-emerald-600 font-medium">
                          {item.nouvel_emplacement_nom || "-"}
                        </td>
                        <td className="px-4 py-3">{item.motif || "-"}</td>
                        <td className="px-4 py-3 font-medium">{item.responsable_transfert_nom || "-"}</td>
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
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-background rounded-lg shadow-xl w-full max-w-md p-6 space-y-4">
            <h2 className="text-xl font-bold">Transférer une Immobilisation</h2>
            <form onSubmit={handleSubmitTransfer} className="space-y-4">
              <div>
                <label className="text-sm font-medium">Équipement / Immobilisation</label>
                <select
                  value={selectedImmo}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSelectedImmo(Number(e.target.value))}
                  required
                  className="w-full h-10 px-3 border rounded-md bg-background text-sm"
                >
                  <option value="">Choisir un équipement</option>
                  {immobilisations.map((immo) => (
                    <option key={immo.id} value={immo.id}>
                      {immo.code_inventaire} - {immo.designation} (Actuel: {immo.emplacement_actuel_nom || "Aucun"})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-medium">Destination (Nouvel Emplacement)</label>
                <select
                  value={nouvelEmplacement}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setNouvelEmplacement(Number(e.target.value))}
                  required
                  className="w-full h-10 px-3 border rounded-md bg-background text-sm"
                >
                  <option value="">Choisir l'emplacement de destination</option>
                  {emplacements.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.nom_emplacement} ({emp.code_emplacement})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-medium">Motif du transfert</label>
                <Input
                  value={motif}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMotif(e.target.value)}
                  placeholder="Ex: Réaffectation, Maintenance..."
                />
              </div>

              <div>
                <label className="text-sm font-medium">Commentaire / Remarques</label>
                <Input
                  value={commentaire}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCommentaire(e.target.value)}
                  placeholder="Notes optionnelles..."
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                  Annuler
                </Button>
                <Button type="submit">Valider le transfert</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
