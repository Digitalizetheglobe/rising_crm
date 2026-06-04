import { signToken } from '../config/jwt';
import { Types } from 'mongoose';

export const generateToken = (UserId: Types.ObjectId, roleId: Types.ObjectId): string => {
    return signToken({ id: UserId, role: roleId });
};