import Joi from 'joi';

export const createUserSchema = Joi.object({
    name: Joi.string().required().trim(),
    email: Joi.string().email().required().lowercase(),
    password: Joi.string().min(6).required(),
    phone: Joi.string().trim().pattern(/^[6-9]\d{9}$/).optional().allow('').messages({
        'string.pattern.base': 'Phone must be a valid 10-digit Indian mobile number (starts with 6-9)',
    }),
    role: Joi.string().valid(
        "SUPER_ADMIN",
        "ADMIN",
        "SALES_MANAGER",
        "SALES_EXECUTIVE",
        "FINANCE_MANAGER",
        "FINANCIAL_EXECUTIVE",
        "VIEWER"
    ).optional(),
});

export const updateUserSchema = Joi.object({
    name: Joi.string().trim().optional(),
    email: Joi.string().email().lowercase().optional(),
    password: Joi.string().min(6).optional(),
    phone: Joi.string().trim().pattern(/^[6-9]\d{9}$/).optional().allow('').messages({
        'string.pattern.base': 'Phone must be a valid 10-digit Indian mobile number (starts with 6-9)',
    }),
    isActive: Joi.boolean().optional(),
    role: Joi.string().valid(
        "SUPER_ADMIN",
        "ADMIN",
        "SALES_MANAGER",
        "SALES_EXECUTIVE",
        "FINANCE_MANAGER",
        "FINANCIAL_EXECUTIVE",
        "VIEWER"
    ).optional(),
});
