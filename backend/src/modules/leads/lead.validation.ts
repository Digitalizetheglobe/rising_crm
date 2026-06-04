import Joi from 'joi';
import { LEAD_STATUSES, LEAD_SOURCES, LEAD_PRIORITIES, BUDGET_RANGES, PROPERTY_TYPES } from './lead.constants';

export const createLeadSchema = Joi.object({
    name:              Joi.string().trim().required().messages({ 'any.required': 'Name is required' }),
    phone:             Joi.string().trim().pattern(/^[6-9]\d{9}$/).required().messages({
                           'string.pattern.base': 'Enter a valid 10-digit Indian mobile number',
                           'any.required':        'Phone number is required',
                       }),
    email:             Joi.string().email().optional().allow(''),
    source:            Joi.string().valid(...LEAD_SOURCES).required().messages({ 'any.required': 'Source is required' }),
    priority:          Joi.string().valid(...LEAD_PRIORITIES).default('Medium'),
    budgetRange:       Joi.string().valid(...BUDGET_RANGES).optional(),
    propertyType:      Joi.string().valid(...PROPERTY_TYPES).optional(),
    preferredLocation: Joi.string().optional().allow(''),
    interestedProject: Joi.string().hex().length(24).optional(),
    interestedUnit:    Joi.string().hex().length(24).optional(),
    assignedTo:        Joi.string().hex().length(24).optional(),
    nextFollowUpDate:  Joi.date().optional(),
    notes:             Joi.string().optional().allow(''),
    enquiryId:         Joi.string().hex().length(24).optional(),
});

export const updateLeadSchema = Joi.object({
    name:              Joi.string().trim().optional(),
    phone:             Joi.string().trim().pattern(/^[6-9]\d{9}$/).optional(),
    email:             Joi.string().email().optional().allow(''),
    source:            Joi.string().valid(...LEAD_SOURCES).optional(),
    priority:          Joi.string().valid(...LEAD_PRIORITIES).optional(),
    budgetRange:       Joi.string().valid(...BUDGET_RANGES).optional(),
    propertyType:      Joi.string().valid(...PROPERTY_TYPES).optional(),
    preferredLocation: Joi.string().optional().allow(''),
    interestedProject: Joi.string().hex().length(24).optional(),
    interestedUnit:    Joi.string().hex().length(24).optional(),
    nextFollowUpDate:  Joi.date().optional(),
    lastContactedAt:   Joi.date().optional(),
    notes:             Joi.string().optional().allow(''),
});

export const updateLeadStatusSchema = Joi.object({
    status:     Joi.string().valid(...LEAD_STATUSES).required().messages({ 'any.required': 'Status is required' }),
    notes:      Joi.string().optional().allow(''),
    lostReason: Joi.string().when('status', {
        is:        'LOST',
        then:      Joi.required().messages({ 'any.required': 'Lost reason is required when marking as lost' }),
        otherwise: Joi.optional().allow(''),
    }),
    duplicateOfLead: Joi.string().hex().length(24).when('status', {
        is:        'DUPLICATE',
        then:      Joi.required().messages({ 'any.required': 'Original lead ID is required when marking as duplicate' }),
        otherwise: Joi.optional(),
    }),
});

export const assignLeadSchema = Joi.object({
    assignedTo: Joi.string().hex().length(24).required().messages({ 'any.required': 'Sales executive ID is required' }),
    reason:     Joi.string().optional().allow(''),
});