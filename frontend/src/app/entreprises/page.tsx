"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, Edit, Trash2, Building2 } from "lucide-react";
import { PageContainer } from "@/components/layout/PageContainer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { entreprisesApi } from "@/services/api/users";
import type { Entreprise } from "@/types/api";

export default function EntreprisesPage() {
  const router = useRouter();
  const [items, setItems] = useState<Entreprise[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await entreprisesApi.list(search ? { search } : undefined);
      if (Array.isArray(data)) setItems(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [search]);

  const handleDelete = async (id: number) => {
    if (confirm("Voulez-vous supprimer cette entreprise ?")) {
      try {
        await entreprisesApi.delete(id);
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
            <h1 className="text-3xl font-bold tracking-tight">Gestion des Entreprises</h1>
            <p className="text-muted-foreground">
              Administration des entités morales et sociétés du système.
            </p>
          </div>
          <Button onClick={() => router.push("/entreprises/creer")} className="shadow-md bg-[#1C1917] text-white">
            + Nouvelle Entreprise
          </Button>
        </div>

        <div className="flex items-center gap-4">
          <Input
            placeholder="Rechercher nom, matricule fiscal, email..."
            value={search}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
            className="max-w-sm"
          />
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-medium">Sociétés Enregistrées ({items.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="py-8 text-center text-muted-foreground">Chargement en cours...</div>
            ) : items.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">Aucune entreprise trouvée.</div>
            ) : (
              <div className="relative overflow-x-auto">
                <table className="w-full text-sm text-left border-collapse">
                  <thead className="bg-muted/50 text-muted-foreground uppercase text-xs">
                    <tr>
                      <th className="px-4 py-3">Raison Sociale</th>
                      <th className="px-4 py-3">Matricule Fiscal</th>
                      <th className="px-4 py-3">Secteur</th>
                      <th className="px-4 py-3">Contact</th>
                      <th className="px-4 py-3">Départements</th>
                      <th className="px-4 py-3">Statut</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {items.map((item) => (
                      <tr key={item.id} className="hover:bg-muted/20">
                        <td className="px-4 py-3 font-semibold flex items-center gap-3">
                          {item.logo ? (
                            <img src={item.logo} alt={item.nom} className="w-8 h-8 rounded-md object-contain border border-[#E0DACB] p-0.5 bg-white shrink-0" />
                          ) : (
                            <div className="w-8 h-8 rounded-md bg-[#EAE3CE] text-[#1C1917] flex items-center justify-center font-bold text-xs shrink-0">
                              {item.nom.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <span>{item.nom}</span>
                        </td>
                        <td className="px-4 py-3 font-mono">{item.matricule_fiscal || "-"}</td>
                        <td className="px-4 py-3 text-muted-foreground">{item.secteur_activite || "-"}</td>
                        <td className="px-4 py-3 space-y-0.5 text-xs">
                          {item.email && <div>{item.email}</div>}
                          {item.telephone && <div className="text-muted-foreground">{item.telephone}</div>}
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#EAE3CE] text-[#1C1917]">
                            <Building2 className="w-3.5 h-3.5 text-[#78716C]" />
                            {item.departements_count ?? 0} dépt(s)
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={item.actif ? "default" : "secondary"}>
                            {item.actif ? "Actif" : "Inactif"}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button size="icon" variant="ghost" className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50" title="Voir les détails" onClick={() => router.push(`/entreprises/${item.id}`)}>
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button size="icon" variant="ghost" className="h-8 w-8 text-amber-600 hover:text-amber-700 hover:bg-amber-50" title="Éditer" onClick={() => router.push(`/entreprises/${item.id}/editer`)}>
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
    </PageContainer>
  );
}
