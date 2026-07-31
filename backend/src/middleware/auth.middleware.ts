import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../config/jwt';
import { tenantMiddleware } from './tenant.middleware';
import User from '../modules/auth/auth.model';

export interface AuthRequest extends Request {
    user?: {
        UserId: string;
        role: string;
        tenantId?: string;
    };
}

export const protect = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        let token;
        
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }

        if (!token) {
            res.status(401).json({ success: false, message: 'Not authorized to access this route' });
            return;
        }

        const decoded = verifyToken(token) as any;
        
        // Verify user still exists and is active
        const user = await User.findByPk(decoded.UserId);
        if (!user || !user.isActive) {
            res.status(401).json({ success: false, message: 'User no longer exists or is deactivated' });
            return;
        }

        req.user = {
            UserId: decoded.UserId,
            role: decoded.role,
            tenantId: decoded.tenantId || user.tenantId
        };
        
        // Initialize tenant context for this request
        tenantMiddleware(req, res, next);
    } catch (error) {
        res.status(401).json({ success: false, message: 'Not authorized, token failed' });
    }
};