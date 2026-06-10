"use client";

import { usePathname } from "next/navigation";
import DashboardLayout from "./DashboardLayout";
import AuthGuard from "../Components/AuthGuard";

const AUTH_ROUTES = ["/login", "/signup"];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthRoute = AUTH_ROUTES.some((r) => pathname.startsWith(r));

  return (
    <AuthGuard>
      {isAuthRoute ? children : <DashboardLayout>{children}</DashboardLayout>}
    </AuthGuard>
  );
}
