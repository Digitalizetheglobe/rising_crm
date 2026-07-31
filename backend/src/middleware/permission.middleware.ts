import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth.middleware';
import { ApiError } from '../utils/ApiError';
import Role from '../modules/roles/role.model';
import Permission from '../modules/roles/permission.model';
import { ROLES } from '../constants/roles';

export const checkPermission = (moduleName: string, actionName: string) => {
    return async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
        try {
            const roleName = req.user?.role;
            if (!roleName) {
                return next(new ApiError(401, 'Unauthorized. Please log in.'));
            }

            // Super Admin has all permissions
            if (roleName === ROLES.SUPER_ADMIN) {
                return next();
            }

            // Lookup the role in the database along with its permissions
            const roleRecord = await Role.findOne({
                where: { name: roleName },
                include: [{
                    model: Permission,
                    as: 'permissions',
                    where: { module: moduleName, action: actionName },
                    required: true // inner join to ensure the permission exists for this role
                }]
            });

            if (!roleRecord) {
                return next(new ApiError(403, `Forbidden. You do not have permission to perform this action (${moduleName}:${actionName}).`));
            }

            next();
        } catch (error) {
            next(error);
        }
    };
};
