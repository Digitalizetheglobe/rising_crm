import Joi from 'joi';
import { FEEDBACK_CATEGORIES, FEEDBACK_STATUSES } from './feedback.constants';

const objectId = Joi.string().hex().length(24);

export const createFeedbackSchema = Joi.object({
    client:   objectId.required(),
    rating:   Joi.number().integer().min(1).max(5).required(),
    category: Joi.string().valid(...FEEDBACK_CATEGORIES).required(),
    comment:  Joi.string().trim().allow('').optional(),
});

export const updateFeedbackSchema = Joi.object({
    rating:   Joi.number().integer().min(1).max(5),
    category: Joi.string().valid(...FEEDBACK_CATEGORIES),
    comment:  Joi.string().trim().allow(''),
    status:   Joi.string().valid('OPEN', 'ACKNOWLEDGED'),  // RESOLVED only via /resolve endpoint
}).min(1);

export const resolveFeedbackSchema = Joi.object({
    resolvedNote: Joi.string().trim().required(),
});