// import { Response, NextFunction } from 'express';
// import { AuthRequest } from './auth.middleware';
// import { ApiError } from '../utils/ApiError';
// import { Role } from '../modules/roles/role.model';

// export const allowRoles = (...roles: string[]) =>
//     async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
//         try {
//             const role = await Role.findById(req.user?.role);
//             if (!role || !roles.includes((role as any).name)) {
//                 return next(new ApiError(403, 'Access denied. Insufficient permissions.'));
//             }
//             next();
//         } catch {
//             next(new ApiError(500, 'Role verification failed.'));
//         }
//     };

import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth.middleware';
import { ApiError } from '../utils/ApiError';

export const allowRoles = (...roles: string[]) =>
    (req: AuthRequest, res: Response, next: NextFunction): void => {
        if (!req.user || !roles.includes(req.user.role)) {
            return next(new ApiError(403, 'Access denied. Insufficient permissions.'));
        }
        next();
    };