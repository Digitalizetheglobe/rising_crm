import Joi from 'joi';

export const createEnquirySchema = Joi.object({
    name:              Joi.string().trim().required().messages({ 'any.required': 'Name is required' }),
    phone:             Joi.string().trim().pattern(/^[6-9]\d{9}$/).required().messages({
                           'string.pattern.base': 'Enter a valid 10-digit Indian mobile number',
                           'any.required': 'Phone number is required',
                       }),
    email:             Joi.string().email().optional().allow(''),
    source:            Joi.string().valid('Website', 'Advertisement', 'Referral', 'Walk-In', 'Phone', 'WhatsApp', 'Email', 'Social Media', 'META_ADS', 'Other').required(),
    platform:          Joi.string().valid('facebook', 'instagram').optional(),
    message:           Joi.string().optional().allow(''),
    budgetRange:       Joi.string().valid('Under 25L', '25L-50L', '50L-1Cr', '1Cr-2Cr', 'Above 2Cr').optional(),
    propertyType:      Joi.string().valid('1BHK', '2BHK', '3BHK', '4+BHK', 'Villa', 'Banglow', 'Plot', 'Residential', 'Commercial', 'Apartment', 'Shop', 'Office').optional(),
    preferredLocation: Joi.string().optional().allow(''),
    interestedProject: Joi.string().hex().length(24).optional(),
    notes:             Joi.string().optional().allow(''),
});

export const updateEnquirySchema = Joi.object({
    name:              Joi.string().trim().optional(),
    phone:             Joi.string().trim().pattern(/^[6-9]\d{9}$/).optional(),
    email:             Joi.string().email().optional().allow(''),
    source:            Joi.string().valid('Website', 'Advertisement', 'Referral', 'Walk-In', 'Phone', 'WhatsApp', 'Email', 'Social Media', 'META_ADS', 'Other').optional(),
    platform:          Joi.string().valid('facebook', 'instagram').optional(),
    message:           Joi.string().optional().allow(''),
    budgetRange:       Joi.string().valid('Under 25L', '25L-50L', '50L-1Cr', '1Cr-2Cr', 'Above 2Cr').optional(),
    propertyType:      Joi.string().valid('1BHK', '2BHK', '3BHK', '4+BHK', 'Villa', 'Banglow', 'Plot', 'Residential', 'Commercial', 'Apartment', 'Shop', 'Office').optional(),
    preferredLocation: Joi.string().optional().allow(''),
    interestedProject: Joi.string().hex().length(24).optional(),
    notes:             Joi.string().optional().allow(''),
    lastContactedAt:   Joi.date().optional(),
});

export const updateStatusSchema = Joi.object({
    status: Joi.string()
        .valid('Pending', 'Contacted', 'Qualified', 'Converted', 'Rejected')
        .required()
        .messages({ 'any.required': 'Status is required' }),
    notes:           Joi.string().optional().allow(''),
    rejectionReason: Joi.string().when('status', {
        is: 'Rejected',
        then: Joi.required().messages({ 'any.required': 'Rejection reason is required when rejecting' }),
        otherwise: Joi.optional().allow(''),
    }),
});

export const assignEnquirySchema = Joi.object({
    assignedTo: Joi.string().hex().length(24).required().messages({
        'any.required': 'Sales executive ID is required',
    }),
});

export const convertToLeadSchema = Joi.object({
    assignedTo:      Joi.string().hex().length(24).required().messages({
                         'any.required': 'Sales executive to assign the lead is required',
                     }),
    followUpDate:    Joi.date().min('now').required().messages({
                         'any.required': 'First follow-up date is required',
                         'date.min':     'Follow-up date must be in the future',
                     }),
    followUpNotes:   Joi.string().optional().allow(''),
    priority:        Joi.string().valid('Low', 'Medium', 'High').default('Medium'),
});