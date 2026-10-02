"use client";

import React, { useEffect, useState } from "react";
import { PageContainer } from "@/components/layout/PageContainer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  usersApi,
  rolesApi,
  permissionsApi,
  departementsApi,
  entreprisesApi,
} from "@/services/api/users";
import type { Utilisateur, Role, Permission, Departement, Entreprise } from "@/types/api";
import {
  Users,
  ShieldCheck,
  Key,
  Search,
  Pencil,
  Trash2,
  CheckCircle2,
  XCircle,
  UserPlus,
  Building2,
  FolderTree,
  Mail,
  Phone,
  UserCheck,
  UserX,
  Check,
  X,
} from "lucide-react";

const MODULE_CONFIG: Record<string, { label: string; description: string }> = {
  familles: {
    label: "Familles d'immobilisations",
    description: "Classification et catégorisation des familles de biens",
  },
  immobilisations: {
    label: "Immobilisations & Biens",
    description: "Fiches d'actifs, suivi physique, réformes et inventaires",
  },
  emplacements: {
    label: "Emplacements & Sites",
    description: "Gestion des sites géographiques, bâtiments, étages et bureaux",
  },
  amortissements: {
    label: "Amortissements Comptables",
    description: "Calculs, dotations annuelles et tableaux comptables",
  },
  maintenance: {
    label: "Maintenance & Interventions",
    description: "Contrats de maintenance, prestataires et interventions",
  },
  users: {
    label: "Utilisateurs & Sécurité",
    description: "Gestion des accès, rôles, permissions et départements",
  },
  audit: {
    label: "Historique & Traçabilité",
    description: "Journaux d'audit et historique complet des modifications",
  },
  entreprises: {
    label: "Entreprise & Paramètres",
    description: "Paramètres de la société, règles d'alerte et notifications",
  },
};

export default function RolesPermissionsUsersPage() {
  const [activeTab, setActiveTab] = useState<"users" | "roles" | "permissions">("users");

  // Data states
  const [usersList, setUsersList] = useState<Utilisateur[]>([]);
  const [rolesList, setRolesList] = useState<Role[]>([]);
  const [permissionsList, setPermissionsList] = useState<Permission[]>([]);
  const [departementsList, setDepartementsList] = useState<Departement[]>([]);
  const [entreprisesList, setEntreprisesList] = useState<Entreprise[]>([]);

  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // User Modal State
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState<number | null>(null);
  const [userUsername, setUserUsername] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [userPassword, setUserPassword] = useState("");
  const [userFirstName, setUserFirstName] = useState("");
  const [userLastName, setUserLastName] = useState("");
  const [userTelephone, setUserTelephone] = useState("");
  const [userRoleId, setUserRoleId] = useState<number | "">("");
  const [userDeptId, setUserDeptId] = useState<number | "">("");
  const [userEntrepriseId, setUserEntrepriseId] = useState<number | "">("");

  // Role Modal State
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [editingRoleId, setEditingRoleId] = useState<number | null>(null);
  const [roleNom, setRoleNom] = useState("");
  const [roleDescription, setRoleDescription] = useState("");
  const [selectedPermissions, setSelectedPermissions] = useState<number[]>([]);

  // Permission assign modal state
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [assigningPermission, setAssigningPermission] = useState<Permission | null>(null);
  const [assignRoleId, setAssignRoleId] = useState<number | "">("");
  const [assignSaving, setAssignSaving] = useState(false);
  const [assignSuccess, setAssignSuccess] = useState(false);

  // Load All Data
  const loadData = async () => {
    setLoading(true);
    try {
      const [resUsers, resRoles, resPerms, resDepts, resEnts] = await Promise.all([
        usersApi.list(search ? { search } : undefined),
        rolesApi.list(search ? { search } : undefined),
        permissionsApi.list(search ? { search } : undefined),
        departementsApi.list(),
        entreprisesApi.list(),
      ]);

      if (Array.isArray(resUsers)) setUsersList(resUsers);
      if (Array.isArray(resRoles)) setRolesList(resRoles);
      if (Array.isArray(resPerms)) setPermissionsList(resPerms);
      if (Array.isArray(resDepts)) setDepartementsList(resDepts);
      if (Array.isArray(resEnts)) setEntreprisesList(resEnts);
    } catch (err) {
      console.error("Error loading data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [search]);

  // --- USER HANDLERS ---
  const handleOpenCreateUser = () => {
    setEditingUserId(null);
    setUserUsername("");
    setUserEmail("");
    setUserPassword("");
    setUserFirstName("");
    setUserLastName("");
    setUserTelephone("");
    setUserRoleId("");
    setUserDeptId("");
    setUserEntrepriseId(entreprisesList.length > 0 ? entreprisesList[0].id : "");
    setIsUserModalOpen(true);
  };

  const handleOpenEditUser = (u: Utilisateur) => {
    setEditingUserId(u.id);
    setUserUsername(u.username);
    setUserEmail(u.email || "");
    setUserPassword("");
    setUserFirstName(u.first_name || "");
    setUserLastName(u.last_name || "");
    setUserTelephone(u.telephone || "");
    setUserRoleId(u.role || "");
    setUserDeptId(u.departement || "");
    setUserEntrepriseId(u.entreprise || "");
    setIsUserModalOpen(true);
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload: Partial<Utilisateur> & { password?: string } = {
        username: userUsername,
        email: userEmail,
        first_name: userFirstName,
        last_name: userLastName,
        telephone: userTelephone,
        role: userRoleId ? Number(userRoleId) : null,
        departement: userDeptId ? Number(userDeptId) : null,
        entreprise: userEntrepriseId ? Number(userEntrepriseId) : null,
      };

      if (userPassword) {
        payload.password = userPassword;
      }

      if (editingUserId) {
        await usersApi.update(editingUserId, payload);
      } else {
        await usersApi.create(payload);
      }
      setIsUserModalOpen(false);
      loadData();
    } catch (err) {
      console.error("Error saving user:", err);
      alert("Erreur lors de l'enregistrement de l'utilisateur.");
    }
  };

  const handleToggleUserActivation = async (u: Utilisateur) => {
    try {
      if (u.actif) {
        await usersApi.deactivate(u.id);
      } else {
        await usersApi.activate(u.id);
      }
      loadData();
    } catch (err) {
      console.error("Error toggling activation:", err);
    }
  };

  const handleDeleteUser = async (id: number, username: string) => {
    if (confirm(`Êtes-vous sûr de vouloir désactiver/supprimer l'utilisateur "${username}" ?`)) {
      try {
        await usersApi.delete(id);
        loadData();
      } catch (err) {
        console.error("Error deleting user:", err);
      }
    }
  };

  // --- ROLE HANDLERS ---
  const handleOpenCreateRole = () => {
    setEditingRoleId(null);
    setRoleNom("");
    setRoleDescription("");
    setSelectedPermissions([]);
    setIsRoleModalOpen(true);
  };

  const handleOpenEditRole = (r: Role) => {
    setEditingRoleId(r.id);
    setRoleNom(r.nom);
    setRoleDescription(r.description || "");
    const permIds = r.permissions_details
      ? r.permissions_details.map((p) => p.id)
      : r.permissions || [];
    setSelectedPermissions(permIds);
    setIsRoleModalOpen(true);
  };

  const togglePermission = (permId: number) => {
    setSelectedPermissions((prev) =>
      prev.includes(permId) ? prev.filter((id) => id !== permId) : [...prev, permId]
    );
  };

  const handleSaveRole = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        nom: roleNom,
        description: roleDescription,
        permissions: selectedPermissions,
      };
      if (editingRoleId) {
        await rolesApi.update(editingRoleId, payload);
      } else {
        await rolesApi.create(payload);
      }
      setIsRoleModalOpen(false);
      loadData();
    } catch (err) {
      console.error("Error saving role:", err);
      alert("Erreur lors de l'enregistrement du rôle.");
    }
  };

  const handleDeleteRole = async (id: number, nom: string) => {
    if (confirm(`Voulez-vous vraiment supprimer le rôle "${nom}" ?`)) {
      try {
        await rolesApi.delete(id);
        loadData();
      } catch (err) {
        console.error("Error deleting role:", err);
      }
    }
  };

  // --- PERMISSION ASSIGN HANDLER ---
  const handleOpenAssign = (p: Permission) => {
    setAssigningPermission(p);
    setAssignRoleId("");
    setAssignSuccess(false);
    setIsAssignModalOpen(true);
  };

  const handleAssignPermission = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignRoleId || !assigningPermission) return;
    setAssignSaving(true);
    try {
      const role = rolesList.find((r) => r.id === Number(assignRoleId));
      if (!role) return;
      const existingPermIds = role.permissions_details
        ? role.permissions_details.map((p) => p.id)
        : role.permissions || [];
      const newPermIds = existingPermIds.includes(assigningPermission.id)
        ? existingPermIds
        : [...existingPermIds, assigningPermission.id];
      await rolesApi.update(Number(assignRoleId), { permissions: newPermIds });
      setAssignSuccess(true);
      loadData();
    } catch (err) {
      console.error("Error assigning permission:", err);
      alert("Erreur lors de l'assignation de la permission.");
    } finally {
      setAssignSaving(false);
    }
  };

  // Group permissions by module
  const groupedPermissions = permissionsList.reduce<Record<string, Permission[]>>((acc, perm) => {
    const mod = perm.module || "Général";
    if (!acc[mod]) acc[mod] = [];
    acc[mod].push(perm);
    return acc;
  }, {});

  return (
    <PageContainer>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-[#1C1917]">
              Gestion des Accès &amp; Sécurité
            </h1>
            <p className="text-sm text-[#78716C]">
              Administration centralisée des utilisateurs, rôles et privilèges du système.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {activeTab === "users" && (
              <Button onClick={handleOpenCreateUser} className="bg-[#483C2C] text-white hover:bg-[#382E22]">
                <UserPlus className="w-4 h-4 mr-2" />
                + Nouvel Utilisateur
              </Button>
            )}
            {activeTab === "roles" && (
              <Button onClick={handleOpenCreateRole} className="bg-[#483C2C] text-white hover:bg-[#382E22]">
                <ShieldCheck className="w-4 h-4 mr-2" />
                + Nouveau Rôle
              </Button>
            )}
          </div>
        </div>

        {/* Tab Navigation Controls */}
        <div className="flex items-center gap-2 border-b border-[#E0DACB] pb-px">
          <button
            onClick={() => setActiveTab("users")}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all cursor-pointer border-b-2 ${
              activeTab === "users"
                ? "border-[#1C1917] bg-white text-[#1C1917] shadow-2xs"
                : "border-transparent text-[#78716C] hover:text-[#1C1917] hover:bg-[#FAF8F2]"
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Utilisateurs</span>
            <span className="ml-1 text-[10px] px-2 py-0.5 rounded-full bg-[#FAF8F2] border border-[#E0DACB]">
              {usersList.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("roles")}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all cursor-pointer border-b-2 ${
              activeTab === "roles"
                ? "border-[#1C1917] bg-white text-[#1C1917] shadow-2xs"
                : "border-transparent text-[#78716C] hover:text-[#1C1917] hover:bg-[#FAF8F2]"
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Rôles &amp; Accès</span>
            <span className="ml-1 text-[10px] px-2 py-0.5 rounded-full bg-[#FAF8F2] border border-[#E0DACB]">
              {rolesList.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("permissions")}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all cursor-pointer border-b-2 ${
              activeTab === "permissions"
                ? "border-[#1C1917] bg-white text-[#1C1917] shadow-2xs"
                : "border-transparent text-[#78716C] hover:text-[#1C1917] hover:bg-[#FAF8F2]"
            }`}
          >
            <Key className="w-4 h-4" />
            <span>Catalogue des Permissions</span>
            <span className="ml-1 text-[10px] px-2 py-0.5 rounded-full bg-[#FAF8F2] border border-[#E0DACB]">
              {permissionsList.length}
            </span>
          </button>
        </div>

        {/* Global Search Bar */}
        <div className="flex items-center gap-4">
          <div className="relative w-full max-w-sm">
            <Search className="w-4 h-4 text-[#A8A29E] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <Input
              placeholder={
                activeTab === "users"
                  ? "Rechercher un utilisateur, email, rôle..."
                  : activeTab === "roles"
                  ? "Rechercher un rôle..."
                  : "Rechercher une permission..."
              }
              value={search}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
              className="pl-9 bg-white border-[#E0DACB] text-xs"
            />
          </div>
        </div>

        {/* TAB 1: USERS TAB */}
        {activeTab === "users" && (
          <Card className="bg-white border-[#E0DACB]">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold text-[#1C1917]">
                Liste des Utilisateurs ({usersList.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="py-8 text-center text-xs text-[#78716C]">Chargement des utilisateurs...</div>
              ) : usersList.length === 0 ? (
                <div className="py-8 text-center text-xs text-[#78716C]">Aucun utilisateur trouvé.</div>
              ) : (
                <div className="relative overflow-x-auto">
                  <table className="w-full text-sm text-left border-collapse">
                    <thead className="bg-[#FAF8F2] text-[#78716C] uppercase text-xs border-b border-[#E0DACB]">
                      <tr>
                        <th className="px-4 py-3">Utilisateur</th>
                        <th className="px-4 py-3">Contact</th>
                        <th className="px-4 py-3">Entreprise</th>
                        <th className="px-4 py-3">Rôle</th>
                        <th className="px-4 py-3">Département</th>
                        <th className="px-4 py-3">Statut</th>
                        <th className="px-4 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E0DACB]/50">
                      {usersList.map((u) => {
                        const fullName = `${u.first_name || ""} ${u.last_name || ""}`.trim() || u.username;
                        const initials = (u.first_name?.[0] || u.username[0] || "U").toUpperCase();
                        return (
                          <tr key={u.id} className="hover:bg-[#FAF8F2]/60 transition-colors">
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-3">
                                <div className="h-9 w-9 rounded-full bg-[#483C2C] text-white font-bold text-xs flex items-center justify-center shrink-0">
                                  {initials}
                                </div>
                                <div>
                                  <div className="font-bold text-[#1C1917] text-xs flex items-center gap-1.5">
                                    <span>{fullName}</span>
                                    {u.est_admin_entreprise && (
                                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-300">
                                        Admin
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-[11px] text-[#78716C]">@{u.username}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-xs space-y-0.5">
                              {u.email && (
                                <div className="flex items-center gap-1 text-[#44403C]">
                                  <Mail className="w-3 h-3 text-[#78716C]" />
                                  <span>{u.email}</span>
                                </div>
                              )}
                              {u.telephone && (
                                <div className="flex items-center gap-1 text-[#78716C]">
                                  <Phone className="w-3 h-3" />
                                  <span>{u.telephone}</span>
                                </div>
                              )}
                            </td>
                            <td className="px-4 py-3 text-xs font-semibold text-[#1C1917]">
                              {u.entreprise_nom ? (
                                <div className="flex items-center gap-1.5">
                                  <Building2 className="w-3.5 h-3.5 text-[#78716C]" />
                                  <span>{u.entreprise_nom}</span>
                                </div>
                              ) : (
                                <span className="text-[#A8A29E]">-</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-xs">
                              {u.role_nom ? (
                                <Badge variant="outline" className="border-[#E0DACB] text-[#1C1917] bg-[#FAF8F2]">
                                  <ShieldCheck className="w-3 h-3 mr-1 text-[#78716C]" />
                                  {u.role_nom}
                                </Badge>
                              ) : (
                                <span className="text-[#A8A29E] text-xs">Aucun rôle</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-xs text-[#57534E]">
                              {u.departement_nom ? (
                                <div className="flex items-center gap-1.5">
                                  <FolderTree className="w-3.5 h-3.5 text-[#78716C]" />
                                  <span>{u.departement_nom}</span>
                                </div>
                              ) : (
                                <span className="text-[#A8A29E]">-</span>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              {u.actif ? (
                                <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">
                                  <CheckCircle2 className="w-3 h-3 mr-1" /> Actif
                                </Badge>
                              ) : (
                                <Badge className="bg-rose-50 text-rose-700 border-rose-200">
                                  <XCircle className="w-3 h-3 mr-1" /> Inactif
                                </Badge>
                              )}
                            </td>
                            <td className="px-4 py-3 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className={`h-8 w-8 ${u.actif ? "text-rose-600 hover:text-rose-700 hover:bg-rose-50" : "text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"}`}
                                  onClick={() => handleToggleUserActivation(u)}
                                  title={u.actif ? "Désactiver le compte" : "Activer le compte"}
                                >
                                  {u.actif ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                                </Button>
                                <Button size="icon" variant="ghost" className="h-8 w-8 text-amber-600 hover:text-amber-700 hover:bg-amber-50" title="Éditer" onClick={() => handleOpenEditUser(u)}>
                                  <Pencil className="w-4 h-4" />
                                </Button>
                                <Button size="icon" variant="ghost" className="h-8 w-8 text-rose-600 hover:text-rose-700 hover:bg-rose-50" title="Supprimer" onClick={() => handleDeleteUser(u.id, u.username)}>
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* TAB 2: ROLES TAB */}
        {activeTab === "roles" && (
          <Card className="bg-white border-[#E0DACB]">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold text-[#1C1917]">
                Profils de Rôles Enregistrés ({rolesList.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="py-8 text-center text-xs text-[#78716C]">Chargement des rôles...</div>
              ) : rolesList.length === 0 ? (
                <div className="py-8 text-center text-xs text-[#78716C]">Aucun rôle trouvé.</div>
              ) : (
                <div className="relative overflow-x-auto">
                  <table className="w-full text-sm text-left border-collapse">
                    <thead className="bg-[#FAF8F2] text-[#78716C] uppercase text-xs border-b border-[#E0DACB]">
                      <tr>
                        <th className="px-4 py-3">Rôle</th>
                        <th className="px-4 py-3">Description</th>
                        <th className="px-4 py-3">Entreprise</th>
                        <th className="px-4 py-3">Utilisateurs</th>
                        <th className="px-4 py-3">Permissions Accordées</th>
                        <th className="px-4 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E0DACB]/50">
                      {rolesList.map((r) => (
                        <tr key={r.id} className="hover:bg-[#FAF8F2]/60 transition-colors">
                          <td className="px-4 py-3 font-semibold text-[#1C1917] flex items-center gap-2">
                            <ShieldCheck className="w-4 h-4 text-[#78716C]" />
                            <span>{r.nom}</span>
                          </td>
                          <td className="px-4 py-3 text-xs text-[#78716C] max-w-xs truncate">
                            {r.description || "-"}
                          </td>
                          <td className="px-4 py-3 text-xs text-[#44403C]">
                            {r.entreprise_nom || "-"}
                          </td>
                          <td className="px-4 py-3 font-mono text-xs font-bold text-[#1C1917]">
                            <span className="px-2 py-0.5 bg-[#FAF8F2] border border-[#E0DACB] rounded-full">
                              {r.utilisateurs_count ?? 0}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex flex-wrap gap-1 max-w-sm">
                              {r.permissions_details && r.permissions_details.length > 0 ? (
                                r.permissions_details.map((p) => (
                                  <Badge key={p.id} variant="secondary" className="text-[10px] bg-[#F5F2EB] text-[#44403C]">
                                    {p.nom}
                                  </Badge>
                                ))
                              ) : (
                                <span className="text-xs text-[#A8A29E]">Aucune permission</span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button size="icon" variant="ghost" className="h-8 w-8 text-amber-600 hover:text-amber-700 hover:bg-amber-50" title="Éditer" onClick={() => handleOpenEditRole(r)}>
                                <Pencil className="w-4 h-4" />
                              </Button>
                              <Button size="icon" variant="ghost" className="h-8 w-8 text-rose-600 hover:text-rose-700 hover:bg-rose-50" title="Supprimer" onClick={() => handleDeleteRole(r.id, r.nom)}>
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
        )}

        {/* TAB 3: PERMISSIONS CATALOGUE (read-only + assign to role) */}
        {activeTab === "permissions" && (
          <div className="space-y-4">
            {/* Info banner */}
            <div className="flex items-start gap-3 bg-[#FAF8F2] border border-[#E0DACB] rounded-xl px-4 py-3">
              <Key className="w-4 h-4 text-[#78716C] mt-0.5 shrink-0" />
              <p className="text-xs text-[#57534E] leading-relaxed">
                Ce catalogue affiche toutes les permissions disponibles dans le système, organisées par module.
                Cliquez sur <strong>Assigner à un rôle</strong> pour attribuer une permission à un rôle existant.
              </p>
            </div>

            <Card className="bg-white border-[#E0DACB]">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-bold text-[#1C1917] flex items-center gap-2">
                  <Key className="w-5 h-5 text-[#78716C]" />
                  <span>Catalogue des Permissions Système ({permissionsList.length})</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="py-8 text-center text-xs text-[#78716C]">Chargement des permissions...</div>
                ) : Object.keys(groupedPermissions).length === 0 ? (
                  <div className="py-8 text-center text-xs text-[#78716C]">Aucune permission trouvée.</div>
                ) : (
                  <div className="space-y-5">
                    {Object.entries(groupedPermissions).map(([moduleName, perms]) => {
                      const modInfo = MODULE_CONFIG[moduleName] || {
                        label: moduleName.charAt(0).toUpperCase() + moduleName.slice(1),
                        description: "",
                      };
                      return (
                        <div key={moduleName} className="border border-[#E0DACB] rounded-xl overflow-hidden shadow-2xs">
                          {/* Module header */}
                          <div className="bg-[#FAF8F2] px-4 py-3 border-b border-[#E0DACB] flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                              <div className="h-2.5 w-2.5 rounded-full bg-[#483C2C]" />
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-xs text-[#1C1917]">
                                    {modInfo.label}
                                  </span>
                                  <span className="font-mono text-[10px] text-[#78716C] uppercase bg-white px-1.5 py-0.5 rounded border border-[#E0DACB]">
                                    {moduleName}
                                  </span>
                                </div>
                                {modInfo.description && (
                                  <p className="text-[11px] text-[#78716C] mt-0.5">{modInfo.description}</p>
                                )}
                              </div>
                            </div>
                            <span className="text-[11px] font-semibold bg-white px-2.5 py-1 rounded-full border border-[#E0DACB] text-[#57534E]">
                              {perms.length} permission{perms.length > 1 ? "s" : ""}
                            </span>
                          </div>

                        {/* Permission cards — read-only + assign button */}
                        <div className="p-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                          {perms.map((p) => {
                            // Which roles already have this permission?
                            const rolesWithPerm = rolesList.filter((r) =>
                              r.permissions_details?.some((rp) => rp.id === p.id)
                            );
                            return (
                              <div
                                key={p.id}
                                className="p-3 bg-white rounded-xl border border-[#E0DACB]/80 space-y-2.5 shadow-2xs hover:border-[#483C2C]/30 transition-colors"
                              >
                                {/* Name + code */}
                                <div>
                                  <div className="font-bold text-xs text-[#1C1917]">{p.nom}</div>
                                  <div className="font-mono text-[10px] text-[#78716C] bg-[#FAF8F2] px-1.5 py-0.5 rounded border border-[#E0DACB]/50 w-fit mt-1">
                                    {p.code}
                                  </div>
                                </div>

                                {/* Roles that have this permission */}
                                {rolesWithPerm.length > 0 && (
                                  <div className="flex flex-wrap gap-1">
                                    {rolesWithPerm.map((r) => (
                                      <span
                                        key={r.id}
                                        className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium"
                                      >
                                        <Check className="w-2.5 h-2.5" />
                                        {r.nom}
                                      </span>
                                    ))}
                                  </div>
                                )}

                                {/* Assign button */}
                                <button
                                  onClick={() => handleOpenAssign(p)}
                                  className="w-full text-[11px] font-semibold text-[#483C2C] border border-[#483C2C]/40 hover:bg-[#483C2C] hover:text-white rounded-lg py-1.5 transition-all"
                                >
                                  Assigner à un rôle
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* USER MODAL (Create / Edit) */}
      {isUserModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 space-y-4 border border-[#E0DACB] max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold text-[#1C1917]">
              {editingUserId ? "Modifier l'utilisateur" : "Nouveau Compte Utilisateur"}
            </h2>
            <form onSubmit={handleSaveUser} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-[#78716C]">Nom d&apos;utilisateur *</label>
                  <Input value={userUsername} onChange={(e) => setUserUsername(e.target.value)} required placeholder="j.dupont" />
                </div>
                <div>
                  <label className="text-xs font-medium text-[#78716C]">E-mail *</label>
                  <Input type="email" value={userEmail} onChange={(e) => setUserEmail(e.target.value)} required placeholder="jean.dupont@entreprise.tn" />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-[#78716C]">
                  {editingUserId ? "Nouveau Mot de Passe (laisser vide si inchangé)" : "Mot de passe *"}
                </label>
                <Input type="password" value={userPassword} onChange={(e) => setUserPassword(e.target.value)} required={!editingUserId} placeholder="••••••••" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-[#78716C]">Prénom</label>
                  <Input value={userFirstName} onChange={(e) => setUserFirstName(e.target.value)} placeholder="Jean" />
                </div>
                <div>
                  <label className="text-xs font-medium text-[#78716C]">Nom</label>
                  <Input value={userLastName} onChange={(e) => setUserLastName(e.target.value)} placeholder="Dupont" />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-[#78716C]">Téléphone</label>
                <Input value={userTelephone} onChange={(e) => setUserTelephone(e.target.value)} placeholder="+216 20 123 456" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-[#78716C]">Rôle d&apos;Accès</label>
                  <select value={userRoleId} onChange={(e) => setUserRoleId(e.target.value ? Number(e.target.value) : "")} className="w-full bg-white border border-[#E0DACB] rounded-xl text-xs p-2.5 outline-none focus:ring-1 focus:ring-[#483C2C]">
                    <option value="">-- Aucun rôle --</option>
                    {rolesList.map((r) => (<option key={r.id} value={r.id}>{r.nom} ({r.entreprise_nom || "Global"})</option>))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-[#78716C]">Département</label>
                  <select value={userDeptId} onChange={(e) => setUserDeptId(e.target.value ? Number(e.target.value) : "")} className="w-full bg-white border border-[#E0DACB] rounded-xl text-xs p-2.5 outline-none focus:ring-1 focus:ring-[#483C2C]">
                    <option value="">-- Aucun département --</option>
                    {departementsList.map((d) => (<option key={d.id} value={d.id}>{d.nom}</option>))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#E0DACB]/50">
                <Button type="button" variant="outline" onClick={() => setIsUserModalOpen(false)}>Annuler</Button>
                <Button type="submit" className="bg-[#483C2C] text-white">Enregistrer</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ROLE MODAL (Create / Edit) */}
      {isRoleModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 space-y-4 border border-[#E0DACB] max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold text-[#1C1917]">
              {editingRoleId ? "Modifier le Rôle" : "Nouveau Rôle d'Accès"}
            </h2>
            <form onSubmit={handleSaveRole} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-[#78716C]">Nom du Rôle *</label>
                <Input value={roleNom} onChange={(e) => setRoleNom(e.target.value)} required placeholder="Ex: Agent de Saisie" />
              </div>
              <div>
                <label className="text-xs font-medium text-[#78716C]">Description</label>
                <Input value={roleDescription} onChange={(e) => setRoleDescription(e.target.value)} placeholder="Description des responsabilités..." />
              </div>

              <div>
                <label className="text-xs font-medium text-[#78716C] mb-2 block">Permissions à attribuer</label>
                {permissionsList.length === 0 ? (
                  <p className="text-xs text-[#78716C]">Aucune permission disponible dans le système.</p>
                ) : (
                  <div className="space-y-3 max-h-56 overflow-y-auto border border-[#E0DACB] p-3 rounded-xl bg-[#FAF8F2]/30">
                    {Object.entries(groupedPermissions).map(([modName, perms]) => {
                      const modLabel = MODULE_CONFIG[modName]?.label || modName.toUpperCase();
                      return (
                        <div key={modName} className="space-y-1">
                          <div className="text-[11px] font-bold text-[#1C1917] bg-[#FAF8F2] px-2 py-1 rounded flex items-center justify-between border border-[#E0DACB]/50">
                            <span>{modLabel}</span>
                            <span className="text-[10px] font-mono text-[#78716C] uppercase bg-white px-1.5 py-0.5 rounded border border-[#E0DACB]">
                              {modName}
                            </span>
                          </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pl-2">
                          {perms.map((p) => (
                            <label key={p.id} className="flex items-center gap-2 text-xs cursor-pointer hover:bg-[#FAF8F2] p-1.5 rounded-lg border border-transparent hover:border-[#E0DACB]/60">
                              <input
                                type="checkbox"
                                checked={selectedPermissions.includes(p.id)}
                                onChange={() => togglePermission(p.id)}
                                className="rounded border-gray-300 text-[#483C2C] focus:ring-[#483C2C]"
                              />
                              <span className="font-semibold text-[#1C1917]">{p.nom}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#E0DACB]/50">
                <Button type="button" variant="outline" onClick={() => setIsRoleModalOpen(false)}>Annuler</Button>
                <Button type="submit" className="bg-[#483C2C] text-white">Enregistrer</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PERMISSION ASSIGN MODAL */}
      {isAssignModalOpen && assigningPermission && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4 border border-[#E0DACB]">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-base font-bold text-[#1C1917]">Assigner la permission</h2>
                <p className="text-xs text-[#78716C] mt-0.5">Choisissez un rôle pour y ajouter cette permission.</p>
              </div>
              <button onClick={() => setIsAssignModalOpen(false)} className="p-1 rounded-lg hover:bg-[#FAF8F2] text-[#78716C]">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Permission info card */}
            <div className="bg-[#FAF8F2] border border-[#E0DACB] rounded-xl p-3 space-y-1">
              <div className="font-bold text-sm text-[#1C1917]">{assigningPermission.nom}</div>
              <div className="font-mono text-[11px] text-[#78716C]">{assigningPermission.code}</div>
              <div className="text-[11px] text-[#A8A29E] uppercase tracking-wide">{assigningPermission.module}</div>
            </div>

            {assignSuccess ? (
              <div className="flex flex-col items-center gap-3 py-4">
                <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center">
                  <Check className="w-5 h-5 text-emerald-600" />
                </div>
                <p className="text-sm font-semibold text-[#1C1917]">Permission assignée avec succès !</p>
                <Button variant="outline" onClick={() => setIsAssignModalOpen(false)}>Fermer</Button>
              </div>
            ) : (
              <form onSubmit={handleAssignPermission} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-[#1C1917] mb-1.5 block">Sélectionner un rôle *</label>
                  <select
                    value={assignRoleId}
                    onChange={(e) => setAssignRoleId(e.target.value ? Number(e.target.value) : "")}
                    required
                    className="w-full bg-white border border-[#E0DACB] rounded-xl text-sm p-2.5 outline-none focus:ring-1 focus:ring-[#483C2C]"
                  >
                    <option value="">-- Choisir un rôle --</option>
                    {rolesList.map((r) => {
                      const alreadyHas = r.permissions_details?.some((rp) => rp.id === assigningPermission.id);
                      return (
                        <option key={r.id} value={r.id} disabled={alreadyHas}>
                          {r.nom} {alreadyHas ? "✓ déjà assigné" : ""}
                        </option>
                      );
                    })}
                  </select>
                </div>
                <div className="flex justify-end gap-2 pt-1">
                  <Button type="button" variant="outline" onClick={() => setIsAssignModalOpen(false)}>Annuler</Button>
                  <Button type="submit" disabled={!assignRoleId || assignSaving} className="bg-[#483C2C] text-white">
                    {assignSaving ? "Assignation..." : "Assigner"}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </PageContainer>
  );
}
