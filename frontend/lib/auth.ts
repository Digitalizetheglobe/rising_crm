import type { UserRole } from "./permissions";
import { normalizeRole } from "./permissions";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  isActive: boolean;
}

const TOKEN_KEY = "crm_token";
const USER_KEY = "crm_user";

export const getToken = (): string | null => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
};

export const setAuthSession = (token: string, user: AuthUser) => {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  localStorage.setItem("crm_username", user.name);
  document.cookie = `crm_token=${token}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`;
};

export const clearAuthSession = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem("crm_username");
  document.cookie = "crm_token=; path=/; max-age=0; SameSite=Lax";
};

export const getStoredUser = (): AuthUser | null => {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    const user = JSON.parse(raw) as AuthUser;
    return { ...user, role: normalizeRole(user.role) };
  } catch {
    return null;
  }
};

export const getAuthHeaders = (): Record<string, string> => {
  const token = getToken();
  return {
    "Content-Type": "application/json",
    Authorization: token ? (token.startsWith("Bearer ") ? token : `Bearer ${token}`) : "",
  };
};
