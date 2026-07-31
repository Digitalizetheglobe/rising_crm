import Joi from 'joi';
import { FOLLOWUP_TYPES, FOLLOWUP_STATUSES } from './followup.model';

export const createFollowUpSchema = Joi.object({
    lead:        Joi.string().uuid().required().messages({ 'any.required': 'Lead ID is required' }),
    assignedTo:  Joi.string().uuid().required().messages({ 'any.required': 'Assigned executive ID is required' }),
    type:        Joi.string().valid(...FOLLOWUP_TYPES).required().messages({ 'any.required': 'Follow-up type is required' }),
    scheduledAt: Joi.date().required().messages({ 'any.required': 'Scheduled date and time is required' }),
    notes:       Joi.string().optional().allow(''),
});

export const updateFollowUpSchema = Joi.object({
    type:        Joi.string().valid(...FOLLOWUP_TYPES).optional(),
    scheduledAt: Joi.date().optional(),
    notes:       Joi.string().optional().allow(''),
    outcome:     Joi.string().optional().allow(''),
});

export const completeFollowUpSchema = Joi.object({
    outcome:     Joi.string().required().messages({ 'any.required': 'Outcome is required when completing a follow-up' }),
    notes:       Joi.string().optional().allow(''),
    // optionally schedule the next follow-up right away
    nextFollowUp: Joi.object({
        type:        Joi.string().valid(...FOLLOWUP_TYPES).required(),
        scheduledAt: Joi.date().min('now').required(),
        notes:       Joi.string().optional().allow(''),
    }).optional(),
});

export const rescheduleFollowUpSchema = Joi.object({
    scheduledAt:      Joi.date().min('now').required().messages({
        'any.required': 'New scheduled date is required',
        'date.min':     'Rescheduled date must be in the future',
    }),
    rescheduleReason: Joi.string().required().messages({ 'any.required': 'Reason for rescheduling is required' }),
    notes:            Joi.string().optional().allow(''),
});

export const updateFollowUpStatusSchema = Joi.object({
    status:  Joi.string().valid(...FOLLOWUP_STATUSES).required(),
    notes:   Joi.string().optional().allow(''),
    outcome: Joi.string().when('status', {
        is:        'COMPLETED',
        then:      Joi.required().messages({ 'any.required': 'Outcome is required when completing' }),
        otherwise: Joi.optional().allow(''),
    }),
});