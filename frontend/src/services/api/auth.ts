import { apiClient } from "./client";
import type { Confirm2FAResponse, LoginResponse, RegisterPayload, Setup2FAResponse, Utilisateur } from "@/types/api";

export const authApi = {
  login: (credentials: { username: string; password: string }) =>
    apiClient.post<LoginResponse>("/auth/login/", credentials),

  verify2FALogin: (payload: { temp_token: string; code?: string; backup_code?: string }) =>
    apiClient.post<LoginResponse>("/auth/login/2fa/", payload),

  register: (payload: RegisterPayload) =>
    apiClient.post<{ message: string; user_id: number }>("/auth/register/", payload),

  getMe: () => apiClient.get<Utilisateur>("/auth/me/"),

  updateProfile: (data: Partial<Utilisateur>) =>
    apiClient.patch<Utilisateur>("/auth/me/", data),

  changePassword: (data: { old_password: string; new_password: string; confirm_password: string }) =>
    apiClient.post<{ detail: string }>("/auth/change-password/", data),

  setup2FA: () =>
    apiClient.post<Setup2FAResponse>("/auth/2fa/setup/"),

  confirm2FA: (code: string) =>
    apiClient.post<Confirm2FAResponse>("/auth/2fa/confirm/", { code }),

  disable2FA: (data: { password: string; code: string }) =>
    apiClient.post<{ detail: string }>("/auth/2fa/disable/", data),
};

