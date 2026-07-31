"use client";

import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { API_URL } from "../config/api.config";
import {
  AuthUser,
  clearAuthSession,
  getStoredUser,
  getToken,
  setAuthSession,
} from "../lib/auth";
import { getDefaultRouteForRole } from "../lib/permissions";

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (identifier: string, password: string) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

export interface RegisterPayload {
  name: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  role: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const refreshUser = useCallback(async () => {
    const token = getToken();
    if (!token) {
      setUser(null);
      return;
    }

    try {
      const res = await fetch(`${API_URL}/v1/auth/me`, {
        headers: {
          Authorization: token.startsWith("Bearer ") ? token : `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setUser(data.data);
      setAuthSession(token, data.data);
    } catch {
      clearAuthSession();
      setUser(null);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      const mockUser = {
        id: "6a632ee695d52081e68c0075",
        name: "Super Admin",
        email: "murali@example.com",
        phone: "9876543210",
        role: "SUPER_ADMIN" as any,
        isActive: true
      };
      setUser(mockUser);
      setIsLoading(false);
    };
    init();
  }, []);

  const login = async (identifier: string, password: string) => {
    const res = await fetch(`${API_URL}/v1/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Login failed");

    const { token, user: authUser } = data.data;
    setAuthSession(token, authUser);
    setUser(authUser);
    router.push(getDefaultRouteForRole(authUser.role));
  };

  const register = async (payload: RegisterPayload) => {
    const res = await fetch(`${API_URL}/v1/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Registration failed");

    const { token, user: authUser } = data.data;
    setAuthSession(token, authUser);
    setUser(authUser);
    router.push(getDefaultRouteForRole(authUser.role));
  };

  const logout = () => {
    clearAuthSession();
    setUser(null);
    router.push("/login");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
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
