import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merges class names safely combining clsx and tailwind-merge.
 * Used by shadcn/ui primitives and reusable UI components.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Resolves media paths (avatars, logos) to absolute URLs pointing to the backend.
 * Supports data URLs, relative paths (/media/...), and full URLs.
 */
export function getMediaUrl(path?: string | null): string {
  if (!path) return "";
  if (
    path.startsWith("data:") ||
    path.startsWith("blob:") ||
    path.startsWith("http://") ||
    path.startsWith("https://")
  ) {
    return path;
  }
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
  const backendBase = apiUrl.replace(/\/api\/v1\/?$/, "");
  return `${backendBase}${cleanPath}`;
}
