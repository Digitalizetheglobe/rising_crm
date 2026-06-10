"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "../app/AuthContext";
import { canAccessRoute, getDefaultRouteForRole } from "../lib/permissions";

const AUTH_ROUTES = ["/login", "/signup"];

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoading, isAuthenticated } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const isAuthRoute = AUTH_ROUTES.some((r) => pathname.startsWith(r));

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated && !isAuthRoute) {
      router.replace("/login");
      return;
    }

    if (isAuthenticated && isAuthRoute) {
      router.replace(getDefaultRouteForRole(user!.role));
      return;
    }

    if (isAuthenticated && user && !isAuthRoute && !canAccessRoute(user.role, pathname)) {
      router.replace(getDefaultRouteForRole(user.role));
    }
  }, [isLoading, isAuthenticated, isAuthRoute, pathname, router, user]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FDFCFB]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-brand/30 border-t-brand rounded-full animate-spin" />
          <p className="text-sm font-medium text-slate-500">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated && !isAuthRoute) return null;
  if (isAuthenticated && isAuthRoute) return null;

  return <>{children}</>;
}
