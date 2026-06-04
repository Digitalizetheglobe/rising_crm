import Joi from 'joi';

export const createUserSchema = Joi.object({
    name: Joi.string().required().trim(),
    email: Joi.string().email().required().lowercase(),
    password: Joi.string().min(6).required(),
    role: Joi.string().valid(
        "SUPER_ADMIN",
        "ADMIN",
        "SALES_MANAGER",
        "SALES_EXECUTIVE",
        "FINANCE_MANAGER",
        "VIEWER"
    ).optional(),
});

export const updateUserSchema = Joi.object({
    name: Joi.string().trim().optional(),
    email: Joi.string().email().lowercase().optional(),
    password: Joi.string().min(6).optional(),
    role: Joi.string().valid(
        "SUPER_ADMIN",
        "ADMIN",
        "SALES_MANAGER",
        "SALES_EXECUTIVE",
        "FINANCE_MANAGER",
        "VIEWER"
    ).optional(),
});
