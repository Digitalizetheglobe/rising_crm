import Joi from 'joi';
import { ROLES, SIGNUP_ALLOWED_ROLES } from '../../constants/roles';

export const registerSchema = Joi.object({
    name: Joi.string().trim().min(2).max(100).required(),
    email: Joi.string().email().lowercase().required(),
    phone: Joi.string().trim().pattern(/^[0-9+\-\s()]{10,15}$/).required(),
    password: Joi.string().min(6).required(),
    confirmPassword: Joi.string().valid(Joi.ref('password')).required().messages({
        'any.only': 'Passwords do not match',
    }),
    role: Joi.string()
        .valid(...SIGNUP_ALLOWED_ROLES)
        .default(ROLES.SALES_EXECUTIVE),
});

export const loginSchema = Joi.object({
    phone: Joi.string().trim().pattern(/^[0-9+\-\s()]{10,15}$/).required(),
    password: Joi.string().required(),
});
