import { apiClient } from "./client";

export interface AuditEntry {
  id: string;
  quand: string;
  qui: string;
  entite: string;
  type_action: string;
  action_code: string;
  objet_concerne: string;
  modifications: {
    champ: string;
    ancienne_valeur: string;
    nouvelle_valeur: string;
  }[];
}

export const auditApi = {
  list: (params?: { entite?: string; search?: string; limit?: number }) => {
    const formattedParams: Record<string, string> = {};
    if (params?.entite) formattedParams.entite = params.entite;
    if (params?.search) formattedParams.search = params.search;
    if (params?.limit !== undefined) formattedParams.limit = String(params.limit);
    return apiClient.get<AuditEntry[]>("/audit-trail/", { params: formattedParams });
  },
};
