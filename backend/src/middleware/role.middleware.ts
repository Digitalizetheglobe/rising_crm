import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth.middleware';
import { ApiError } from '../utils/ApiError';
import { LEGACY_FINANCE_ROLE, ROLES, normalizeRole } from '../constants/roles';

const expandRoles = (roles: string[]): string[] => {
    const expanded = new Set(roles);
    const hasFinance = roles.some(
        (r) => r === ROLES.FINANCIAL_EXECUTIVE || r === LEGACY_FINANCE_ROLE
    );
    if (hasFinance) {
        expanded.add(ROLES.FINANCIAL_EXECUTIVE);
        expanded.add(LEGACY_FINANCE_ROLE);
    }
    return Array.from(expanded);
};

export const allowRoles = (...roles: string[]) =>
    (req: AuthRequest, res: Response, next: NextFunction): void => {
        if (!req.user) {
            return next(new ApiError(403, 'Access denied. Insufficient permissions.'));
        }

        const userRole = normalizeRole(req.user.role);
        const allowed = expandRoles(roles).map(normalizeRole);

        if (!allowed.includes(userRole)) {
            return next(new ApiError(403, 'Access denied. Insufficient permissions.'));
        }
        next();
    };
