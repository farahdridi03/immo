import { apiClient } from "./client";
import { HealthStatusResponse } from "@/types/api";

export async function fetchBackendHealth(): Promise<HealthStatusResponse> {
  return apiClient.get<HealthStatusResponse>("/health/");
}
