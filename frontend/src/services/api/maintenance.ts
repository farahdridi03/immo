import { apiClient } from "./client";
import type {
  ContratMaintenance,
  DocumentContrat,
  Intervention,
  Alerte,
} from "@/types/api";

export const contratsApi = {
  list: (params?: Record<string, string>) =>
    apiClient.get<ContratMaintenance[]>("/contrats/", { params }),
  get: (id: number) =>
    apiClient.get<ContratMaintenance>(`/contrats/${id}/`),
  create: (data: Partial<ContratMaintenance>) =>
    apiClient.post<ContratMaintenance>("/contrats/", data),
  update: (id: number, data: Partial<ContratMaintenance>) =>
    apiClient.put<ContratMaintenance>(`/contrats/${id}/`, data),
  delete: (id: number) =>
    apiClient.delete<void>(`/contrats/${id}/`),
  assignImmobilisations: (id: number, immobilisations: number[]) =>
    apiClient.post<ContratMaintenance>(`/contrats/${id}/assign_immobilisations/`, {
      immobilisations,
    }),
};

export const documentsContratApi = {
  create: (formData: FormData) =>
    apiClient.post<DocumentContrat>("/documents-contrats/", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  delete: (id: number) =>
    apiClient.delete<void>(`/documents-contrats/${id}/`),
};

export const interventionsApi = {
  list: (params?: Record<string, string>) =>
    apiClient.get<Intervention[]>("/interventions/", { params }),
  get: (id: number) =>
    apiClient.get<Intervention>(`/interventions/${id}/`),
  create: (data: Partial<Intervention>) =>
    apiClient.post<Intervention>("/interventions/", data),
  update: (id: number, data: Partial<Intervention>) =>
    apiClient.put<Intervention>(`/interventions/${id}/`, data),
  delete: (id: number) =>
    apiClient.delete<void>(`/interventions/${id}/`),
};

export const alertesApi = {
  list: (params?: Record<string, string>) =>
    apiClient.get<Alerte[]>("/alertes/", { params }),
  marquerLu: (id: number) =>
    apiClient.post<Alerte>(`/alertes/${id}/marquer_lu/`),
  marquerToutLu: () =>
    apiClient.post<{ status: string; message: string }>("/alertes/marquer_tout_lu/"),
  delete: (id: number) =>
    apiClient.delete<void>(`/alertes/${id}/`),
};
