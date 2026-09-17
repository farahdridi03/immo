import { env } from "@/lib/env";

export interface RequestOptions extends RequestInit {
  params?: Record<string, string>;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = env.apiUrl) {
    // Strip trailing slash if present
    this.baseUrl = baseUrl.replace(/\/$/, "");
  }

  private buildUrl(endpoint: string, params?: Record<string, string>): string {
    const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
    const url = new URL(`${this.baseUrl}${cleanEndpoint}`);

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, value);
        }
      });
    }

    return url.toString();
  }

  private async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const { params, headers, ...restOptions } = options;
    const url = this.buildUrl(endpoint, params);

    const reqHeaders: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(headers as Record<string, string>),
    };

    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token");
      if (token && !reqHeaders.Authorization) {
        reqHeaders.Authorization = `Bearer ${token}`;
      }
    }

    const config: RequestInit = {
      headers: reqHeaders,
      ...restOptions,
    };

    const response = await fetch(url, config);

    if (!response.ok) {
      if (response.status === 401 && typeof window !== "undefined") {
        const path = window.location.pathname;
        if (path !== "/login" && path !== "/inscription" && path !== "/home") {
          localStorage.removeItem("token");
          window.location.href = "/login";
        }
      }
      const errorText = await response.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { message: errorText || response.statusText };
      }

      let message = errorData?.detail || errorData?.message || errorData?.error?.details?.message;
      if (!message && typeof errorData === "object" && errorData !== null) {
        const errorMessages = Object.entries(errorData).map(([key, val]) => {
          if (Array.isArray(val)) return `${key}: ${val.join(", ")}`;
          if (typeof val === "string") return `${key}: ${val}`;
          return `${key}: ${JSON.stringify(val)}`;
        });
        if (errorMessages.length > 0) {
          message = errorMessages.join(" | ");
        }
      }

      throw new Error(message || `HTTP Error ${response.status}: ${response.statusText}`);
    }

    return response.json() as Promise<T>;
  }

  public get<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: "GET" });
  }

  public post<T>(endpoint: string, data?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: "POST",
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  public put<T>(endpoint: string, data?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: "PUT",
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  public patch<T>(endpoint: string, data?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: "PATCH",
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  public delete<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: "DELETE" });
  }
}

export const apiClient = new ApiClient();
