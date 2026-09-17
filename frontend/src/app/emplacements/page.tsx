"use client";

import React, { useEffect, useState } from "react";
import { PageContainer } from "@/components/layout/PageContainer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { emplacementsApi } from "@/services/api/immobilisations";
import { usersApi } from "@/services/api/users";
import type { Emplacement, TypeEmplacement, Utilisateur } from "@/types/api";
import { AddressMapPicker } from "@/components/ui/AddressMapPicker";

export default function EmplacementsPage() {
  const [items, setItems] = useState<Emplacement[]>([]);
  const [usersList, setUsersList] = useState<Utilisateur[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  // Form states
  const [code, setCode] = useState("");
  const [nom, setNom] = useState("");
  const [type, setType] = useState<TypeEmplacement>("bureau");
  const [adresse, setAdresse] = useState("");
  const [responsable, setResponsable] = useState("");
  const [description, setDescription] = useState("");

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await emplacementsApi.list(search ? { search } : undefined);
      if (Array.isArray(data)) setItems(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const res = await usersApi.list();
      if (Array.isArray(res)) setUsersList(res);
    } catch (err) {
      console.error("Failed to load users", err);
    }
  };

  useEffect(() => {
    loadData();
    loadUsers();
  }, [search]);

  const handleOpenCreate = () => {
    setEditingId(null);
    setCode("");
    setNom("");
    setType("bureau");
    setAdresse("");
    setResponsable("");
    setDescription("");
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: Emplacement) => {
    setEditingId(item.id);
    setCode(item.code_emplacement);
    setNom(item.nom_emplacement);
    setType(item.type);
    setAdresse(item.adresse || "");
    setResponsable(item.responsable || "");
    setDescription(item.description || "");
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        code_emplacement: code,
        nom_emplacement: nom,
        type,
        adresse,
        responsable,
        description,
      };
      if (editingId) {
        await emplacementsApi.update(editingId, payload);
      } else {
        await emplacementsApi.create(payload);
      }
      setIsModalOpen(false);
      loadData();
    } catch (err: any) {
      console.error("Error saving emplacement:", err);
      alert(err?.message || "Erreur lors de l'enregistrement de l'emplacement.");
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm("Voulez-vous supprimer cet emplacement ?")) {
      try {
        await emplacementsApi.delete(id);
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
            <h1 className="text-3xl font-bold tracking-tight">Emplacements & Sites</h1>
            <p className="text-muted-foreground">
              Gérez les locaux, bureaux, dépôts et chantiers de l'entreprise.
            </p>
          </div>
          <Button onClick={handleOpenCreate} className="shadow-md">
            + Nouvel Emplacement
          </Button>
        </div>

        <div className="flex items-center gap-4">
          <Input
            placeholder="Rechercher code, nom, adresse..."
            value={search}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
            className="max-w-xs"
          />
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-medium">Liste des Emplacements ({items.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="py-8 text-center text-muted-foreground">Chargement en cours...</div>
            ) : items.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">Aucun emplacement trouvé.</div>
            ) : (
              <div className="relative overflow-x-auto">
                <table className="w-full text-sm text-left border-collapse">
                  <thead className="bg-muted/50 text-muted-foreground uppercase text-xs">
                    <tr>
                      <th className="px-4 py-3">Code</th>
                      <th className="px-4 py-3">Nom Emplacement</th>
                      <th className="px-4 py-3">Type</th>
                      <th className="px-4 py-3">Responsable</th>
                      <th className="px-4 py-3">Adresse</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {items.map((item) => (
                      <tr key={item.id} className="hover:bg-muted/20">
                        <td className="px-4 py-3 font-mono font-medium">{item.code_emplacement}</td>
                        <td className="px-4 py-3 font-semibold">{item.nom_emplacement}</td>
                        <td className="px-4 py-3">
                          <Badge variant="secondary" className="capitalize">
                            {item.type_display || item.type}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">{item.responsable || "-"}</td>
                        <td className="px-4 py-3 text-muted-foreground">{item.adresse || "-"}</td>
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
          <div className="bg-background rounded-lg shadow-xl w-full max-w-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold">
              {editingId ? "Modifier l'emplacement" : "Créer un emplacement"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium">Code Emplacement</label>
                <Input value={code} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCode(e.target.value)} required placeholder="Ex: EMP-101" />
              </div>
              <div>
                <label className="text-sm font-medium">Nom</label>
                <Input value={nom} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNom(e.target.value)} required placeholder="Ex: Bureau Direction" />
              </div>
              <div>
                <label className="text-sm font-medium">Type</label>
                <select
                  value={type}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setType(e.target.value as TypeEmplacement)}
                  className="w-full h-10 px-3 border rounded-md bg-background text-sm"
                >
                  <option value="bureau">Bureau</option>
                  <option value="depot">Dépôt</option>
                  <option value="chantier">Chantier</option>
                  <option value="agence">Agence</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Responsable</label>
                <select
                  value={responsable}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setResponsable(e.target.value)}
                  className="w-full h-10 px-3 border rounded-md bg-background text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-[#1C1917]"
                >
                  <option value="">-- Aucun responsable --</option>
                  {usersList.map((u) => {
                    const fullName = (u.first_name || u.last_name) ? `${u.first_name} ${u.last_name}`.trim() : u.username;
                    return (
                      <option key={u.id} value={fullName}>
                        {fullName} ({u.email || u.username})
                      </option>
                    );
                  })}
                </select>
              </div>
              
              <AddressMapPicker
                value={adresse}
                onChange={(newAddr) => setAdresse(newAddr)}
                label="Adresse du site"
              />

              <div className="flex justify-end gap-2 pt-2 border-t">
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
