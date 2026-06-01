import { Request, Response, NextFunction } from 'express';
import { ObjectSchema } from 'joi';
import { ApiError } from '../utils/ApiError';

export const validate = (schema: ObjectSchema) =>
    (req: Request, res: Response, next: NextFunction): void => {
        const { error } = schema.validate(req.body, { abortEarly: false });
        if (error) {
            const message = error.details.map(d => d.message).join(', ');
            return next(new ApiError(400, message));
        }
        next();
    };