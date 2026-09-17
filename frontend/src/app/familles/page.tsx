"use client";

import React, { useEffect, useState } from "react";
import { PageContainer } from "@/components/layout/PageContainer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { famillesApi } from "@/services/api/immobilisations";
import type { Famille } from "@/types/api";

export default function FamillesPage() {
  const [familles, setFamilles] = useState<Famille[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  // Form fields
  const [nom, setNom] = useState("");
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");

  const loadFamilles = async () => {
    setLoading(true);
    try {
      const data = await famillesApi.list(search ? { search } : undefined);
      if (Array.isArray(data)) setFamilles(data);
    } catch (err) {
      console.error("Erreur lors du chargement des familles", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFamilles();
  }, [search]);

  const handleOpenCreate = () => {
    setEditingId(null);
    setNom("");
    setCode("");
    setDescription("");
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: Famille) => {
    setEditingId(item.id);
    setNom(item.nom);
    setCode(item.code);
    setDescription(item.description || "");
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await famillesApi.update(editingId, { nom, code, description });
      } else {
        await famillesApi.create({ nom, code, description });
      }
      setIsModalOpen(false);
      loadFamilles();
    } catch (err: any) {
      console.error("Error saving famille:", err);
      alert(err?.message || "Erreur lors de l'enregistrement de la famille.");
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm("Voulez-vous vraiment supprimer cette famille ?")) {
      try {
        await famillesApi.delete(id);
        loadFamilles();
      } catch (err) {
        alert("Impossible de supprimer cette famille.");
      }
    }
  };

  return (
    <PageContainer>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Familles d'Immobilisations</h1>
            <p className="text-muted-foreground">
              Gérez les catégories et classifications de vos équipements.
            </p>
          </div>
          <Button onClick={handleOpenCreate} className="shadow-md">
            + Nouvelle Famille
          </Button>
        </div>

        <div className="flex items-center gap-4">
          <Input
            placeholder="Rechercher par nom, code..."
            value={search}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
            className="max-w-xs"
          />
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-medium">Liste des Familles ({familles.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="py-8 text-center text-muted-foreground">Chargement en cours...</div>
            ) : familles.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">Aucune famille trouvée.</div>
            ) : (
              <div className="relative overflow-x-auto">
                <table className="w-full text-sm text-left border-collapse">
                  <thead className="bg-muted/50 text-muted-foreground uppercase text-xs">
                    <tr>
                      <th className="px-4 py-3">Code</th>
                      <th className="px-4 py-3">Nom</th>
                      <th className="px-4 py-3">Description</th>
                      <th className="px-4 py-3">Entreprise</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {familles.map((item) => (
                      <tr key={item.id} className="hover:bg-muted/20">
                        <td className="px-4 py-3 font-mono font-medium">{item.code}</td>
                        <td className="px-4 py-3 font-semibold">{item.nom}</td>
                        <td className="px-4 py-3 text-muted-foreground">{item.description || "-"}</td>
                        <td className="px-4 py-3">
                          <Badge variant="outline">{item.entreprise_nom || "Entreprise"}</Badge>
                        </td>
                        <td className="px-4 py-3 text-right space-x-2">
                          <Button size="sm" variant="outline" onClick={() => handleOpenEdit(item)}>
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
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-background rounded-lg shadow-xl w-full max-w-md p-6 space-y-4">
            <h2 className="text-xl font-bold">
              {editingId ? "Modifier la famille" : "Créer une famille"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium">Code</label>
                <Input value={code} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCode(e.target.value)} required placeholder="Ex: INF" />
              </div>
              <div>
                <label className="text-sm font-medium">Nom</label>
                <Input value={nom} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNom(e.target.value)} required placeholder="Ex: Informatique" />
              </div>
              <div>
                <label className="text-sm font-medium">Description</label>
                <Input value={description} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDescription(e.target.value)} placeholder="Courte description..." />
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
