import jwt, { JwtPayload } from 'jsonwebtoken';
import { ENV } from './env';

export const signToken = (payload: object): string => {
    return jwt.sign(payload, ENV.JWT_SECRET, {
        expiresIn: ENV.JWT_EXPIRES_IN,
    } as jwt.SignOptions);
};

export const verifyToken = (token: string): JwtPayload => {
    return jwt.verify(token, ENV.JWT_SECRET) as JwtPayload;
};