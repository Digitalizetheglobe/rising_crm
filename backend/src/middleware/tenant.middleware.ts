import { Response, NextFunction } from 'express';
import { requestContext } from '../config/context';
import { AuthRequest } from './auth.middleware';

export const tenantMiddleware = (req: AuthRequest, res: Response, next: NextFunction): void => {
    const tenantId = req.user?.tenantId || 'default-tenant-id';
    const userId = req.user?.UserId;

    requestContext.run({ tenantId, userId }, () => {
        next();
    });
};

export const getTenantId = (): string => {
    return requestContext.getStore()?.tenantId || 'default-tenant-id';
};
