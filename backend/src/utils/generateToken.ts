import { signToken } from '../config/jwt';
import { Types } from 'mongoose';

export const generateToken = (userId: Types.ObjectId, roleId: Types.ObjectId): string => {
    return signToken({ id: userId, role: roleId });
};