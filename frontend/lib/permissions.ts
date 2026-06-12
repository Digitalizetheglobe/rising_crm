export type UserRole =
  | "SUPER_ADMIN"
  | "ADMIN"
  | "SALES_MANAGER"
  | "SALES_EXECUTIVE"
  | "FINANCIAL_EXECUTIVE"
  | "FINANCE_MANAGER"
  | "VIEWER";

export const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: "Super Admin",
  ADMIN: "Admin",
  SALES_MANAGER: "Sales Manager",
  SALES_EXECUTIVE: "Sales Executive",
  FINANCIAL_EXECUTIVE: "Financial Executive",
  FINANCE_MANAGER: "Financial Executive",
  VIEWER: "Viewer",
};

export const SIGNUP_ROLE_OPTIONS = [
  { value: "SUPER_ADMIN", label: "Super Admin" },
  { value: "ADMIN", label: "Admin" },
  { value: "SALES_MANAGER", label: "Sales Manager" },
  { value: "SALES_EXECUTIVE", label: "Sales Executive" },
  { value: "FINANCIAL_EXECUTIVE", label: "Financial Executive" },
] as const;

export const normalizeRole = (role: string): UserRole =>
  role === "FINANCE_MANAGER" ? "FINANCIAL_EXECUTIVE" : (role as UserRole);

/** Route paths each role may access */
const ROLE_ROUTE_ACCESS: Record<string, string[]> = {
  SUPER_ADMIN: ["/", "/leads", "/client", "/enquiry", "/booking", "/payments", "/projects", "/units", "/employee", "/followup"],
  ADMIN: ["/", "/leads", "/client", "/enquiry", "/booking", "/payments", "/projects", "/units", "/employee", "/followup"],
  SALES_MANAGER: ["/", "/enquiry", "/leads", "/client", "/projects", "/units", "/followup"],
  SALES_EXECUTIVE: ["/", "/leads", "/client", "/projects", "/units", "/followup"],
  FINANCIAL_EXECUTIVE: ["/", "/booking", "/client", "/projects", "/units", "/payments"],
  VIEWER: ["/", "/leads", "/client", "/enquiry", "/booking", "/projects", "/units"],
};

export const canAccessRoute = (role: string, pathname: string): boolean => {
  const normalized = normalizeRole(role);
  const allowed = ROLE_ROUTE_ACCESS[normalized] ?? [];
  if (allowed.length === 0) return false;
  return allowed.some(
    (route) => pathname === route || (route !== "/" && pathname.startsWith(route))
  );
};

export const getDefaultRouteForRole = (role: string): string => {
  const normalized = normalizeRole(role);
  const routes = ROLE_ROUTE_ACCESS[normalized];
  return routes?.[0] ?? "/login";
};

export interface NavItem {
  name: string;
  href: string;
  module: string;
}

export const ALL_NAV_ITEMS: NavItem[] = [
  { name: "Dashboard", href: "/", module: "dashboard" },
  { name: "Leads", href: "/leads", module: "leads" },
  { name: "Clients", href: "/client", module: "clients" },
  { name: "Enquiries", href: "/enquiry", module: "enquiries" },
  { name: "Booking", href: "/booking", module: "booking" },
  { name: "Payments", href: "/payments", module: "payments" },
  { name: "Projects", href: "/projects", module: "projects" },
  { name: "Units", href: "/units", module: "units" },
  { name: "Employees", href: "/employee", module: "employees" },
];

const ROLE_NAV_MODULES: Record<string, string[]> = {
  SUPER_ADMIN: ["dashboard", "leads", "clients", "enquiries", "booking", "payments", "projects", "units", "employees"],
  ADMIN: ["dashboard", "leads", "clients", "enquiries", "booking", "payments", "projects", "units", "employees"],
  SALES_MANAGER: ["dashboard", "enquiries", "leads", "clients", "projects", "units"],
  SALES_EXECUTIVE: ["dashboard", "leads", "clients", "projects", "units"],
  FINANCIAL_EXECUTIVE: ["dashboard", "booking", "clients", "projects", "units", "payments"],
  VIEWER: ["dashboard", "leads", "clients", "enquiries", "booking", "projects", "units"],
};

export const getNavItemsForRole = (role: string): NavItem[] => {
  const normalized = normalizeRole(role);
  const modules = ROLE_NAV_MODULES[normalized] ?? [];
  return ALL_NAV_ITEMS.filter((item) => modules.includes(item.module));
};
