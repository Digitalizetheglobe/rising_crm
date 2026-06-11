import { API_URL } from "../config/api.config";
import { getToken } from "./auth";
import { ApiError, apiDownloadBlob } from "./api";

export interface ImportLeadsResult {
  inserted?: number;
  skipped?: number;
  errors?: Array<{ row: number; message: string }>;
}

export async function importLeads(file: File): Promise<ImportLeadsResult> {
  const formData = new FormData();
  formData.append("file", file);

  const token = getToken();
  // No Content-Type header — the browser sets the multipart boundary itself
  const res = await fetch(`${API_URL}/v1/data/import/leads`, {
    method: "POST",
    headers: {
      Authorization: token ? (token.startsWith("Bearer ") ? token : `Bearer ${token}`) : "",
    },
    body: formData,
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new ApiError(data.message || "Import failed", res.status);
  }

  return (data.data ?? data) as ImportLeadsResult;
}

export async function exportLeads(): Promise<Blob> {
  return apiDownloadBlob("/data/export/leads", { method: "GET" });
}
