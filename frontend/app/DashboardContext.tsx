"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export interface Toast {
  id: number;
  message: string;
  type: "success" | "info";
}

interface DashboardContextType {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  userName: string;
  setUserName: (name: string) => void;
  isSidebarOpen: boolean;
  setIsSidebarOpen: (isOpen: boolean) => void;
  toasts: Toast[];
  addToast: (message: string, type?: "success" | "info") => void;
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

export function DashboardProvider({ children }: { children: React.ReactNode }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [userName, setUserName] = useState("Murali Anna");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Load username from localStorage if exists
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedName = localStorage.getItem("crm_username");
      if (savedName) {
        setUserName(savedName);
      }
    }
  }, []);

  const addToast = React.useCallback((message: string, type: "success" | "info" = "success") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  return (
    <DashboardContext.Provider
      value={{
        searchQuery,
        setSearchQuery,
        userName,
        setUserName,
        isSidebarOpen,
        setIsSidebarOpen,
        toasts,
        addToast,
      }}
    >
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboard() {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error("useDashboard must be used within a DashboardProvider");
  }
  return context;
}
