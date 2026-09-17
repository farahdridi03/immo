import { apiClient } from "./client";
import type {
  Departement,
  Entreprise,
  Permission,
  Role,
  Utilisateur,
  UserPreference,
} from "@/types/api";

export const preferencesApi = {
  get: () => apiClient.get<UserPreference>("/auth/preferences/"),
  update: (data: Partial<UserPreference>) =>
    apiClient.patch<UserPreference>("/auth/preferences/", data),
};

export const entreprisesApi = {
  list: (params?: Record<string, string>) =>
    apiClient.get<Entreprise[]>("/entreprises/", { params }),
  get: (id: number) => apiClient.get<Entreprise>(`/entreprises/${id}/`),
  create: (data: Partial<Entreprise>) =>
    apiClient.post<Entreprise>("/entreprises/", data),
  update: (id: number, data: Partial<Entreprise>) =>
    apiClient.patch<Entreprise>(`/entreprises/${id}/`, data),
  delete: (id: number) => apiClient.delete<void>(`/entreprises/${id}/`),
};

export const permissionsApi = {
  list: (params?: Record<string, string>) =>
    apiClient.get<Permission[]>("/permissions/", { params }),
  get: (id: number) => apiClient.get<Permission>(`/permissions/${id}/`),
  create: (data: Partial<Permission>) =>
    apiClient.post<Permission>("/permissions/", data),
  update: (id: number, data: Partial<Permission>) =>
    apiClient.patch<Permission>(`/permissions/${id}/`, data),
  delete: (id: number) => apiClient.delete<void>(`/permissions/${id}/`),
};

export const rolesApi = {
  list: (params?: Record<string, string>) =>
    apiClient.get<Role[]>("/roles/", { params }),
  get: (id: number) => apiClient.get<Role>(`/roles/${id}/`),
  create: (data: Partial<Role> & { permissions?: number[] }) =>
    apiClient.post<Role>("/roles/", data),
  update: (id: number, data: Partial<Role> & { permissions?: number[] }) =>
    apiClient.patch<Role>(`/roles/${id}/`, data),
  delete: (id: number) => apiClient.delete<void>(`/roles/${id}/`),
};

export const departementsApi = {
  list: (params?: Record<string, string>) =>
    apiClient.get<Departement[]>("/departements/", { params }),
  get: (id: number) => apiClient.get<Departement>(`/departements/${id}/`),
  create: (data: Partial<Departement>) =>
    apiClient.post<Departement>("/departements/", data),
  update: (id: number, data: Partial<Departement>) =>
    apiClient.patch<Departement>(`/departements/${id}/`, data),
  delete: (id: number) => apiClient.delete<void>(`/departements/${id}/`),
};

export const usersApi = {
  list: (params?: Record<string, string>) =>
    apiClient.get<Utilisateur[]>("/users/", { params }),
  get: (id: number) => apiClient.get<Utilisateur>(`/users/${id}/`),
  create: (data: Partial<Utilisateur> & { password?: string }) =>
    apiClient.post<Utilisateur>("/users/", data),
  update: (id: number, data: Partial<Utilisateur> & { password?: string }) =>
    apiClient.patch<Utilisateur>(`/users/${id}/`, data),
  delete: (id: number) => apiClient.delete<void>(`/users/${id}/`),
  activate: (id: number) =>
    apiClient.post<{ detail: string }>(`/users/${id}/activate/`, {}),
  deactivate: (id: number) =>
    apiClient.post<{ detail: string }>(`/users/${id}/deactivate/`, {}),
};
