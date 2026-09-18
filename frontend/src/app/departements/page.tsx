"use client";

import React, { useEffect, useState } from "react";
import { PageContainer } from "@/components/layout/PageContainer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { departementsApi, usersApi } from "@/services/api/users";
import type { Departement, Utilisateur } from "@/types/api";
import { Edit, Trash2 } from "lucide-react";

export default function DepartementsPage() {
  const [items, setItems] = useState<Departement[]>([]);
  const [users, setUsers] = useState<Utilisateur[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  // Form states
  const [nom, setNom] = useState("");
  const [responsable, setResponsable] = useState<number | "">("");

  const loadData = async () => {
    setLoading(true);
    try {
      const [resDept, resUsers] = await Promise.all([
        departementsApi.list(search ? { search } : undefined),
        usersApi.list(),
      ]);
      if (Array.isArray(resDept)) setItems(resDept);
      if (Array.isArray(resUsers)) setUsers(resUsers);
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
    setNom("");
    setResponsable("");
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: Departement) => {
    setEditingId(item.id);
    setNom(item.nom);
    setResponsable(item.responsable || "");
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        nom,
        responsable: responsable ? Number(responsable) : null,
      };
      if (editingId) {
        await departementsApi.update(editingId, payload);
      } else {
        await departementsApi.create(payload);
      }
      setIsModalOpen(false);
      loadData();
    } catch (err) {
      alert("Erreur lors de l'enregistrement du département.");
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm("Voulez-vous supprimer ce département ?")) {
      try {
        await departementsApi.delete(id);
        loadData();
      } catch (err) {
        alert("Erreur de suppression.");
      }
    }
  };

  return (
    <PageContainer>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Gestion des Départements</h1>
            <p className="text-muted-foreground">
              Structure organisationnelle et services internes.
            </p>
          </div>
          <Button onClick={handleOpenCreate} className="shadow-md">
            + Nouveau Département
          </Button>
        </div>

        <div className="flex items-center gap-4">
          <Input
            placeholder="Rechercher par nom..."
            value={search}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
            className="max-w-xs"
          />
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-medium">Liste des Départements ({items.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="py-8 text-center text-muted-foreground">Chargement en cours...</div>
            ) : items.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">Aucun département trouvé.</div>
            ) : (
              <div className="relative overflow-x-auto">
                <table className="w-full text-sm text-left border-collapse">
                  <thead className="bg-muted/50 text-muted-foreground uppercase text-xs">
                    <tr>
                      <th className="px-4 py-3">Nom du Département</th>
                      <th className="px-4 py-3">Responsable</th>
                      <th className="px-4 py-3">Entreprise</th>
                      <th className="px-4 py-3">Statut</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {items.map((item) => (
                      <tr key={item.id} className="hover:bg-muted/20">
                        <td className="px-4 py-3 font-semibold">{item.nom}</td>
                        <td className="px-4 py-3 font-medium">{item.responsable_nom || "Non désigné"}</td>
                        <td className="px-4 py-3">
                          <Badge variant="outline">{item.entreprise_nom || "Entreprise"}</Badge>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={item.actif ? "default" : "secondary"}>
                            {item.actif ? "Actif" : "Inactif"}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button size="icon" variant="ghost" className="h-8 w-8 text-amber-600 hover:text-amber-700 hover:bg-amber-50" title="Éditer" onClick={() => handleOpenEdit(item)}>
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button size="icon" variant="ghost" className="h-8 w-8 text-rose-600 hover:text-rose-700 hover:bg-rose-50" title="Supprimer" onClick={() => handleDelete(item.id)}>
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

      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-background rounded-lg shadow-xl w-full max-w-md p-6 space-y-4">
            <h2 className="text-xl font-bold">
              {editingId ? "Modifier le département" : "Créer un département"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium">Nom du Département</label>
                <Input value={nom} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNom(e.target.value)} required placeholder="Ex: Direction Financière" />
              </div>
              <div>
                <label className="text-sm font-medium">Responsable</label>
                <select
                  value={responsable}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setResponsable(e.target.value ? Number(e.target.value) : "")}
                  className="w-full h-10 px-3 border rounded-md bg-background text-sm"
                >
                  <option value="">Sélectionner un responsable</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.first_name || u.last_name ? `${u.first_name} ${u.last_name}` : u.username} ({u.email || u.username})
                    </option>
                  ))}
                </select>
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
