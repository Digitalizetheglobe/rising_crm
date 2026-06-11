import { API_URL } from "../config/api.config";
import { clearAuthSession, getAuthHeaders } from "./auth";

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export async function apiFetch<T = unknown>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(`${API_URL}/v1${path}`, {
    ...options,
    headers: {
      ...getAuthHeaders(),
      ...(options.headers as Record<string, string> | undefined),
    },
  });

  if (res.status === 401) {
    clearAuthSession();
    if (typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
      window.location.href = "/login";
    }
    throw new ApiError("Session expired. Please log in again.", 401);
  }

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new ApiError(data.message || "Request failed", res.status);
  }

  return data as T;
}

export async function apiDownloadBlob(
  path: string,
  options: RequestInit = {}
): Promise<Blob> {
  const res = await fetch(`${API_URL}/v1${path}`, {
    ...options,
    headers: {
      ...getAuthHeaders(),
      ...(options.headers as Record<string, string> | undefined),
    },
  });

  if (res.status === 401) {
    clearAuthSession();
    if (typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
      window.location.href = "/login";
    }
    throw new ApiError("Session expired. Please log in again.", 401);
  }

  if (!res.ok) {
    let msg = "Download failed";
    try {
      const errData = await res.json();
      if (errData.message) msg = errData.message;
    } catch (e) {
      // Ignore
    }
    throw new ApiError(msg, res.status);
  }

  return res.blob();
}
