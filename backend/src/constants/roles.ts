export const ROLES = {
    SUPER_ADMIN: 'SUPER_ADMIN',
    ADMIN: 'ADMIN',
    SALES_MANAGER: 'SALES_MANAGER',
    SALES_EXECUTIVE: 'SALES_EXECUTIVE',
    FINANCIAL_EXECUTIVE: 'FINANCIAL_EXECUTIVE',
    VIEWER: 'VIEWER',
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

/** Roles users may select during public sign-up */
export const SIGNUP_ALLOWED_ROLES: Role[] = [
    ROLES.SUPER_ADMIN,
    ROLES.ADMIN,
    ROLES.SALES_EXECUTIVE,
    ROLES.SALES_MANAGER,
    ROLES.FINANCIAL_EXECUTIVE,
];

/** Legacy alias kept for existing database records */
export const LEGACY_FINANCE_ROLE = 'FINANCE_MANAGER';

export const normalizeRole = (role: string): string =>
    role === LEGACY_FINANCE_ROLE ? ROLES.FINANCIAL_EXECUTIVE : role;

export const isFinanceRole = (role: string): boolean =>
    role === ROLES.FINANCIAL_EXECUTIVE || role === LEGACY_FINANCE_ROLE;
