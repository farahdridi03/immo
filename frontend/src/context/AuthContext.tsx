"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { authApi } from "@/services/api/auth";
import type { LoginResponse, Utilisateur } from "@/types/api";

interface AuthContextType {
  user: Utilisateur | null;
  token: string | null;
  loading: boolean;
  login: (credentials: { username: string; password: string }) => Promise<LoginResponse>;
  verify2FA: (payload: { temp_token: string; code?: string; backup_code?: string }) => Promise<Utilisateur>;
  logout: () => void;
  hasPermission: (code: string) => boolean;
  hasAnyPermission: (codes: string[]) => boolean;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<Utilisateur | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedToken = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (savedToken) {
      setToken(savedToken);
      authApi
        .getMe()
        .then((userData) => {
          setUser(userData);
        })
        .catch(() => {
          localStorage.removeItem("token");
          setToken(null);
          setUser(null);
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, []);

  const refreshUser = async () => {
    try {
      const userData = await authApi.getMe();
      setUser(userData);
    } catch (e) {
      console.error("Failed to refresh user", e);
    }
  };

  const login = async (credentials: { username: string; password: string }) => {
    const res = await authApi.login(credentials);
    if (res.access && res.user) {
      localStorage.setItem("token", res.access);
      setToken(res.access);
      setUser(res.user);
    }
    return res;
  };

  const verify2FA = async (payload: { temp_token: string; code?: string; backup_code?: string }) => {
    const res = await authApi.verify2FALogin(payload);
    if (res.access && res.user) {
      localStorage.setItem("token", res.access);
      setToken(res.access);
      setUser(res.user);
    } else {
      throw new Error("Échec de vérification 2FA.");
    }
    return res.user;
  };

  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
  };

  const hasPermission = (code: string): boolean => {
    if (!user) return false;
    if (user.is_superuser || user.est_admin_entreprise) return true;
    if (user.permissions && user.permissions.includes(code)) return true;
    return false;
  };

  const hasAnyPermission = (codes: string[]): boolean => {
    if (!user) return false;
    if (user.is_superuser || user.est_admin_entreprise) return true;
    if (!codes || codes.length === 0) return true;
    if (user.permissions) {
      return codes.some((code) => user.permissions!.includes(code));
    }
    return false;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        verify2FA,
        logout,
        hasPermission,
        hasAnyPermission,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
