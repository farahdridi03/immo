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
  Plus,
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
} from "lucide-react";

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

  // Permission Modal State
  const [isPermModalOpen, setIsPermModalOpen] = useState(false);
  const [editingPermId, setEditingPermId] = useState<number | null>(null);
  const [permNom, setPermNom] = useState("");
  const [permCode, setPermCode] = useState("");
  const [permModule, setPermModule] = useState("");

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

  // --- PERMISSION HANDLERS ---
  const handleOpenCreatePermission = () => {
    setEditingPermId(null);
    setPermNom("");
    setPermCode("");
    setPermModule("immobilisations");
    setIsPermModalOpen(true);
  };

  const handleOpenEditPermission = (p: Permission) => {
    setEditingPermId(p.id);
    setPermNom(p.nom);
    setPermCode(p.code);
    setPermModule(p.module || "Général");
    setIsPermModalOpen(true);
  };

  const handleSavePermission = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        nom: permNom,
        code: permCode,
        module: permModule,
      };
      if (editingPermId) {
        await permissionsApi.update(editingPermId, payload);
      } else {
        await permissionsApi.create(payload);
      }
      setIsPermModalOpen(false);
      loadData();
    } catch (err) {
      console.error("Error saving permission:", err);
      alert("Erreur lors de l'enregistrement de la permission.");
    }
  };

  const handleDeletePermission = async (id: number, nom: string) => {
    if (confirm(`Voulez-vous vraiment supprimer la permission "${nom}" ?`)) {
      try {
        await permissionsApi.delete(id);
        loadData();
      } catch (err) {
        console.error("Error deleting permission:", err);
      }
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
              Gestion des Accès & Sécurité
            </h1>
            <p className="text-sm text-[#78716C]">
              Administration centralisée des utilisateurs, rôles et privilèges du système.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {activeTab === "users" && (
              <Button onClick={handleOpenCreateUser} className="bg-[#1C1917] text-white hover:bg-[#332F2C]">
                <UserPlus className="w-4 h-4 mr-2" />
                + Nouvel Utilisateur
              </Button>
            )}
            {activeTab === "roles" && (
              <Button onClick={handleOpenCreateRole} className="bg-[#1C1917] text-white hover:bg-[#332F2C]">
                <ShieldCheck className="w-4 h-4 mr-2" />
                + Nouveau Rôle
              </Button>
            )}
            {activeTab === "permissions" && (
              <Button onClick={handleOpenCreatePermission} className="bg-[#1C1917] text-white hover:bg-[#332F2C]">
                <Key className="w-4 h-4 mr-2" />
                + Nouvelle Permission
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
            <span>Rôles & Accès</span>
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
                                <div className="h-9 w-9 rounded-full bg-[#1C1917] text-white font-bold text-xs flex items-center justify-center shrink-0">
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

        {/* TAB 3: PERMISSIONS TAB */}
        {activeTab === "permissions" && (
          <div className="space-y-6">
            <Card className="bg-white border-[#E0DACB]">
              <CardHeader className="flex flex-row items-center justify-between pb-3">
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
                  <div className="space-y-6">
                    {Object.entries(groupedPermissions).map(([moduleName, perms]) => (
                      <div key={moduleName} className="border border-[#E0DACB] rounded-xl overflow-hidden bg-[#FAF8F2]/40">
                        <div className="bg-[#FAF8F2] px-4 py-2.5 border-b border-[#E0DACB] flex items-center justify-between">
                          <span className="font-bold text-xs text-[#1C1917] uppercase tracking-wider">
                            Module : {moduleName}
                          </span>
                          <span className="text-[11px] font-semibold bg-white px-2 py-0.5 rounded-full border border-[#E0DACB] text-[#57534E]">
                            {perms.length} permission(s)
                          </span>
                        </div>
                        <div className="p-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                          {perms.map((p) => (
                            <div key={p.id} className="p-3 bg-white rounded-lg border border-[#E0DACB]/80 space-y-2 shadow-2xs hover:border-[#1C1917]/40 transition-colors">
                              <div className="font-bold text-xs text-[#1C1917] flex items-center justify-between">
                                <span>{p.nom}</span>
                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={() => handleOpenEditPermission(p)}
                                    className="p-1 rounded text-[#78716C] hover:text-[#1C1917] hover:bg-[#FAF8F2]"
                                    title="Éditer la permission"
                                  >
                                    <Pencil className="w-3 h-3" />
                                  </button>
                                  <button
                                    onClick={() => handleDeletePermission(p.id, p.nom)}
                                    className="p-1 rounded text-[#78716C] hover:text-[#DC2626] hover:bg-rose-50"
                                    title="Supprimer la permission"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>
                              <div className="font-mono text-[11px] text-[#78716C] bg-[#FAF8F2] px-2 py-0.5 rounded border border-[#E0DACB]/50 w-fit">
                                code: {p.code}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
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
                  <label className="text-xs font-medium text-[#78716C]">Nom d'utilisateur *</label>
                  <Input
                    value={userUsername}
                    onChange={(e) => setUserUsername(e.target.value)}
                    required
                    placeholder="j.dupont"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-[#78716C]">E-mail *</label>
                  <Input
                    type="email"
                    value={userEmail}
                    onChange={(e) => setUserEmail(e.target.value)}
                    required
                    placeholder="jean.dupont@entreprise.tn"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-[#78716C]">
                  {editingUserId ? "Nouveau Mot de Passe (laisser vide si inchangé)" : "Mot de passe *"}
                </label>
                <Input
                  type="password"
                  value={userPassword}
                  onChange={(e) => setUserPassword(e.target.value)}
                  required={!editingUserId}
                  placeholder="••••••••"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-[#78716C]">Prénom</label>
                  <Input
                    value={userFirstName}
                    onChange={(e) => setUserFirstName(e.target.value)}
                    placeholder="Jean"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-[#78716C]">Nom</label>
                  <Input
                    value={userLastName}
                    onChange={(e) => setUserLastName(e.target.value)}
                    placeholder="Dupont"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-[#78716C]">Téléphone</label>
                <Input
                  value={userTelephone}
                  onChange={(e) => setUserTelephone(e.target.value)}
                  placeholder="+216 20 123 456"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-[#78716C]">Rôle d'Accès</label>
                  <select
                    value={userRoleId}
                    onChange={(e) => setUserRoleId(e.target.value ? Number(e.target.value) : "")}
                    className="w-full bg-white border border-[#E0DACB] rounded-xl text-xs p-2.5 outline-none focus:ring-1 focus:ring-[#1C1917]"
                  >
                    <option value="">-- Aucun rôle --</option>
                    {rolesList.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.nom} ({r.entreprise_nom || "Global"})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-medium text-[#78716C]">Département</label>
                  <select
                    value={userDeptId}
                    onChange={(e) => setUserDeptId(e.target.value ? Number(e.target.value) : "")}
                    className="w-full bg-white border border-[#E0DACB] rounded-xl text-xs p-2.5 outline-none focus:ring-1 focus:ring-[#1C1917]"
                  >
                    <option value="">-- Aucun département --</option>
                    {departementsList.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.nom}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#E0DACB]/50">
                <Button type="button" variant="outline" onClick={() => setIsUserModalOpen(false)}>
                  Annuler
                </Button>
                <Button type="submit" className="bg-[#1C1917] text-white">
                  Enregistrer
                </Button>
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
                <Input
                  value={roleNom}
                  onChange={(e) => setRoleNom(e.target.value)}
                  required
                  placeholder="Ex: Agent de Saisie"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-[#78716C]">Description</label>
                <Input
                  value={roleDescription}
                  onChange={(e) => setRoleDescription(e.target.value)}
                  placeholder="Description des responsabilités..."
                />
              </div>

              <div>
                <label className="text-xs font-medium text-[#78716C] mb-2 block">
                  Permissions à attribuer
                </label>
                {permissionsList.length === 0 ? (
                  <p className="text-xs text-[#78716C]">Aucune permission disponible dans le système.</p>
                ) : (
                  <div className="space-y-3 max-h-56 overflow-y-auto border border-[#E0DACB] p-3 rounded-xl bg-[#FAF8F2]/30">
                    {Object.entries(groupedPermissions).map(([modName, perms]) => (
                      <div key={modName} className="space-y-1">
                        <div className="text-[11px] font-bold text-[#1C1917] uppercase tracking-wider bg-[#FAF8F2] px-2 py-1 rounded">
                          {modName}
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pl-2">
                          {perms.map((p) => (
                            <label
                              key={p.id}
                              className="flex items-center gap-2 text-xs cursor-pointer hover:bg-[#FAF8F2] p-1.5 rounded-lg border border-transparent hover:border-[#E0DACB]/60"
                            >
                              <input
                                type="checkbox"
                                checked={selectedPermissions.includes(p.id)}
                                onChange={() => togglePermission(p.id)}
                                className="rounded border-gray-300 text-[#1C1917] focus:ring-[#1C1917]"
                              />
                              <span className="font-semibold text-[#1C1917]">{p.nom}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#E0DACB]/50">
                <Button type="button" variant="outline" onClick={() => setIsRoleModalOpen(false)}>
                  Annuler
                </Button>
                <Button type="submit" className="bg-[#1C1917] text-white">
                  Enregistrer
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PERMISSION MODAL (Create / Edit) */}
      {isPermModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4 border border-[#E0DACB]">
            <h2 className="text-lg font-bold text-[#1C1917]">
              {editingPermId ? "Modifier la Permission" : "Nouvelle Permission Système"}
            </h2>
            <form onSubmit={handleSavePermission} className="space-y-3">
              <div>
                <label className="text-xs font-medium text-[#78716C]">Nom de la permission *</label>
                <Input
                  value={permNom}
                  onChange={(e) => setPermNom(e.target.value)}
                  required
                  placeholder="ex: Gérer les immobilisations"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-[#78716C]">Code système (unique) *</label>
                <Input
                  value={permCode}
                  onChange={(e) => setPermCode(e.target.value)}
                  required
                  placeholder="ex: manage_immobilisations"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-[#78716C]">Module *</label>
                <select
                  value={permModule}
                  onChange={(e) => setPermModule(e.target.value)}
                  className="w-full bg-white border border-[#E0DACB] rounded-xl text-xs p-2.5 outline-none focus:ring-1 focus:ring-[#1C1917]"
                  required
                >
                  <option value="immobilisations">immobilisations</option>
                  <option value="users">users</option>
                  <option value="maintenance">maintenance</option>
                  <option value="entreprises">entreprises</option>
                  <option value="familles">familles</option>
                  <option value="emplacements">emplacements</option>
                  <option value="amortissements">amortissements</option>
                  <option value="Général">Général</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#E0DACB]/50">
                <Button type="button" variant="outline" onClick={() => setIsPermModalOpen(false)}>
                  Annuler
                </Button>
                <Button type="submit" className="bg-[#1C1917] text-white">
                  {editingPermId ? "Enregistrer" : "Créer"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
