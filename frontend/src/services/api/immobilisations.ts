import { apiClient } from "./client";
import type {
  Emplacement,
  Famille,
  Immobilisation,
  MouvementEmplacement,
} from "@/types/api";

export const famillesApi = {
  list: (params?: Record<string, string>) =>
    apiClient.get<Famille[]>("/familles/", { params }),
  get: (id: number) => apiClient.get<Famille>(`/familles/${id}/`),
  create: (data: Partial<Famille>) =>
    apiClient.post<Famille>("/familles/", data),
  update: (id: number, data: Partial<Famille>) =>
    apiClient.put<Famille>(`/familles/${id}/`, data),
  delete: (id: number) => apiClient.delete<void>(`/familles/${id}/`),
};

export const emplacementsApi = {
  list: (params?: Record<string, string>) =>
    apiClient.get<Emplacement[]>("/emplacements/", { params }),
  get: (id: number) => apiClient.get<Emplacement>(`/emplacements/${id}/`),
  create: (data: Partial<Emplacement>) =>
    apiClient.post<Emplacement>("/emplacements/", data),
  update: (id: number, data: Partial<Emplacement>) =>
    apiClient.put<Emplacement>(`/emplacements/${id}/`, data),
  delete: (id: number) => apiClient.delete<void>(`/emplacements/${id}/`),
};

export const immobilisationsApi = {
  list: (params?: Record<string, string>) =>
    apiClient.get<Immobilisation[]>("/immobilisations/", { params }),
  get: (id: number) => apiClient.get<Immobilisation>(`/immobilisations/${id}/`),
  create: (data: Partial<Immobilisation>) =>
    apiClient.post<Immobilisation>("/immobilisations/", data),
  update: (id: number, data: Partial<Immobilisation>) =>
    apiClient.put<Immobilisation>(`/immobilisations/${id}/`, data),
  delete: (id: number) => apiClient.delete<void>(`/immobilisations/${id}/`),
  transferer: (
    id: number,
    payload: {
      nouvel_emplacement: number;
      motif?: string;
      utilisateur_concerne?: number | null;
      commentaire?: string;
    }
  ) => apiClient.post<Immobilisation>(`/immobilisations/${id}/transferer/`, payload),
  lookupByCode: (code: string) => apiClient.get<Immobilisation>(`/immobilisations/lookup/${encodeURIComponent(code)}/`),
};

export const mouvementsEmplacementApi = {
  list: (params?: Record<string, string>) =>
    apiClient.get<MouvementEmplacement[]>("/mouvements-emplacement/", {
      params,
    }),
  get: (id: number) =>
    apiClient.get<MouvementEmplacement>(`/mouvements-emplacement/${id}/`),
  create: (data: Partial<MouvementEmplacement>) =>
    apiClient.post<MouvementEmplacement>("/mouvements-emplacement/", data),
  delete: (id: number) =>
    apiClient.delete<void>(`/mouvements-emplacement/${id}/`),
};

import type { PlanAmortissement, EcritureAmortissement } from "@/types/api";

export const amortissementsApi = {
  listPlans: (params?: Record<string, string>) =>
    apiClient.get<PlanAmortissement[]>("/plans-amortissement/", { params }),
  getPlan: (id: number) =>
    apiClient.get<PlanAmortissement>(`/plans-amortissement/${id}/`),
  createPlan: (data: Partial<PlanAmortissement>) =>
    apiClient.post<PlanAmortissement>("/plans-amortissement/", data),
  updatePlan: (id: number, data: Partial<PlanAmortissement>) =>
    apiClient.put<PlanAmortissement>(`/plans-amortissement/${id}/`, data),
  deletePlan: (id: number) =>
    apiClient.delete<void>(`/plans-amortissement/${id}/`),
  recalculerPlan: (id: number) =>
    apiClient.post<PlanAmortissement>(`/plans-amortissement/${id}/recalculer/`),
  listEcritures: (params?: Record<string, string>) =>
    apiClient.get<EcritureAmortissement[]>("/ecritures-amortissement/", { params }),
};
