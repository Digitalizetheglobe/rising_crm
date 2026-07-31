import { signToken } from '../config/jwt';

export const generateToken = (UserId: string, roleId: string): string => {
    return signToken({ id: UserId, role: roleId });
};