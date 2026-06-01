import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../config/jwt';
import { ApiError } from '../utils/ApiError';

export interface AuthRequest extends Request {
    user?: {
        id: string;
        role?: string;
    };
}

export const protect = (req: AuthRequest, res: Response, next: NextFunction): void => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return next(new ApiError(401, 'Not authenticated. Please log in.'));
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = verifyToken(token);
        req.user = { id: decoded.id, role: decoded.role };
        next();
    } catch {
        next(new ApiError(401, 'Token is invalid or has expired.'));
    }
};