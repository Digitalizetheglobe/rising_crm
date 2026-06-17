import Joi from 'joi';

export const resolveUnmatchedLeadSchema = Joi.object({
  notes: Joi.string().trim().optional().allow(''),
  status: Joi.string().valid('pending', 'resolved').optional(),
});
