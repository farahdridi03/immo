"use client";

import React, { useEffect, useState } from "react";
import { PageContainer } from "@/components/layout/PageContainer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { departementsApi, rolesApi, usersApi } from "@/services/api/users";
import type { Departement, Role, Utilisateur } from "@/types/api";

export default function UsersPage() {
  const [items, setItems] = useState<Utilisateur[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [departements, setDepartements] = useState<Departement[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  // Form states
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [telephone, setTelephone] = useState("");
  const [role, setRole] = useState<number | "">("");
  const [departement, setDepartement] = useState<number | "">("");

  const loadData = async () => {
    setLoading(true);
    try {
      const [resUsers, resRoles, resDept] = await Promise.all([
        usersApi.list(search ? { search } : undefined),
        rolesApi.list(),
        departementsApi.list(),
      ]);
      if (Array.isArray(resUsers)) setItems(resUsers);
      if (Array.isArray(resRoles)) setRoles(resRoles);
      if (Array.isArray(resDept)) setDepartements(resDept);
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
    setUsername("");
    setEmail("");
    setPassword("");
    setFirstName("");
    setLastName("");
    setTelephone("");
    setRole("");
    setDepartement("");
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: Utilisateur) => {
    setEditingId(item.id);
    setUsername(item.username);
    setEmail(item.email || "");
    setPassword("");
    setFirstName(item.first_name || "");
    setLastName(item.last_name || "");
    setTelephone(item.telephone || "");
    setRole(item.role || "");
    setDepartement(item.departement || "");
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload: Partial<Utilisateur> & { password?: string } = {
        username,
        email,
        first_name: firstName,
        last_name: lastName,
        telephone,
        role: role ? Number(role) : null,
        departement: departement ? Number(departement) : null,
      };

      if (password) {
        payload.password = password;
      }

      if (editingId) {
        await usersApi.update(editingId, payload);
      } else {
        await usersApi.create(payload);
      }
      setIsModalOpen(false);
      loadData();
    } catch (err) {
      alert("Erreur lors de l'enregistrement de l'utilisateur.");
    }
  };

  const handleToggleActivate = async (user: Utilisateur) => {
    try {
      if (user.actif) {
        await usersApi.deactivate(user.id);
      } else {
        await usersApi.activate(user.id);
      }
      loadData();
    } catch (err) {
      alert("Erreur lors du changement de statut.");
    }
  };

  return (
    <PageContainer>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Gestion des Utilisateurs</h1>
            <p className="text-muted-foreground">
              Comptes d'accès, affectations aux départements et attribution des rôles.
            </p>
          </div>
          <Button onClick={handleOpenCreate} className="shadow-md">
            + Nouvel Utilisateur
          </Button>
        </div>

        <div className="flex items-center gap-4">
          <Input
            placeholder="Rechercher par nom, nom d'utilisateur, email..."
            value={search}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
            className="max-w-sm"
          />
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-medium">Comptes Utilisateurs ({items.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="py-8 text-center text-muted-foreground">Chargement en cours...</div>
            ) : items.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">Aucun utilisateur trouvé.</div>
            ) : (
              <div className="relative overflow-x-auto">
                <table className="w-full text-sm text-left border-collapse">
                  <thead className="bg-muted/50 text-muted-foreground uppercase text-xs">
                    <tr>
                      <th className="px-4 py-3">Utilisateur</th>
                      <th className="px-4 py-3">Nom & Prénom</th>
                      <th className="px-4 py-3">Email / Tel</th>
                      <th className="px-4 py-3">Rôle</th>
                      <th className="px-4 py-3">Département</th>
                      <th className="px-4 py-3">Statut</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {items.map((item) => (
                      <tr key={item.id} className="hover:bg-muted/20">
                        <td className="px-4 py-3 font-semibold font-mono flex items-center gap-1.5">
                          {item.username}
                          {item.est_admin_entreprise && (
                            <Badge variant="default" className="text-[10px] px-1.5 py-0 bg-amber-600">
                              Admin Initial
                            </Badge>
                          )}
                        </td>
                        <td className="px-4 py-3 font-medium">
                          {item.first_name || item.last_name
                            ? `${item.first_name} ${item.last_name}`
                            : "-"}
                        </td>
                        <td className="px-4 py-3 space-y-0.5 text-xs">
                          {item.email && <div>{item.email}</div>}
                          {item.telephone && <div className="text-muted-foreground">{item.telephone}</div>}
                        </td>
                        <td className="px-4 py-3">
                          {item.role_nom ? (
                            <Badge variant="outline">{item.role_nom}</Badge>
                          ) : (
                            <span className="text-xs text-muted-foreground">Aucun</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {item.departement_nom || "-"}
                        </td>
                        <td className="px-4 py-3">
                          <Badge
                            variant={
                              item.statut_compte === "actif" || item.actif
                                ? "default"
                                : item.statut_compte === "en_attente_validation"
                                ? "secondary"
                                : "destructive"
                            }
                          >
                            {item.statut_compte === "en_attente_validation"
                              ? "En attente"
                              : item.actif || item.statut_compte === "actif"
                              ? "Actif"
                              : "Inactif"}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-right space-x-2">
                          <Button size="sm" variant="outline" onClick={() => handleOpenEdit(item)}>
                            Éditer
                          </Button>
                          {!item.est_admin_entreprise && (
                            <Button
                              size="sm"
                              variant={item.actif ? "destructive" : "default"}
                              onClick={() => handleToggleActivate(item)}
                            >
                              {item.actif ? "Désactiver" : "Activer"}
                            </Button>
                          )}
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
              {editingId ? "Modifier l'utilisateur" : "Créer un utilisateur"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Nom d'utilisateur</label>
                  <Input
                    value={username}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUsername(e.target.value)}
                    required
                    placeholder="Ex: jdoe"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">
                    Mot de passe {editingId ? "(laisser vide si inchangé)" : ""}
                  </label>
                  <Input
                    type="password"
                    value={password}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                    required={!editingId}
                    placeholder="••••••••"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Prénom</label>
                  <Input
                    value={firstName}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFirstName(e.target.value)}
                    placeholder="John"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Nom</label>
                  <Input
                    value={lastName}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLastName(e.target.value)}
                    placeholder="Doe"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Email</label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                    placeholder="john@entreprise.tn"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Téléphone</label>
                  <Input
                    value={telephone}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTelephone(e.target.value)}
                    placeholder="+216 20 000 000"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Rôle</label>
                  <select
                    value={role}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setRole(e.target.value ? Number(e.target.value) : "")}
                    className="w-full h-10 px-3 border rounded-md bg-background text-sm"
                  >
                    <option value="">Sélectionner un rôle</option>
                    {roles.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.nom}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium">Département</label>
                  <select
                    value={departement}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setDepartement(e.target.value ? Number(e.target.value) : "")}
                    className="w-full h-10 px-3 border rounded-md bg-background text-sm"
                  >
                    <option value="">Sélectionner un département</option>
                    {departements.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.nom}
                      </option>
                    ))}
                  </select>
                </div>
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
