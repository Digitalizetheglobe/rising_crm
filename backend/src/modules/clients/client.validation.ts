import Joi from 'joi';
import { CLIENT_STATUSES } from './client.constants';

const objectId = Joi.string().uuid();
const phoneSchema = Joi.string().trim().pattern(/^[6-9]\d{9}$/);

const addressSchema = Joi.object({
    line1: Joi.string().trim().allow(''),
    line2: Joi.string().trim().allow(''),
    city: Joi.string().trim().allow(''),
    state: Joi.string().trim().allow(''),
    country: Joi.string().trim().allow(''),
    pincode: Joi.string().trim().allow(''),
});

export const createClientSchema = Joi.object({
    name: Joi.string().trim().required(),
    phone: phoneSchema.required(),
    email: Joi.string().email().allow(''),
    alternatePhone: phoneSchema.allow(''),
    address: addressSchema,
    dateOfBirth: Joi.date(),
    aadhaarNumber: Joi.string().trim().allow(''),
    panNumber: Joi.string().trim().uppercase().allow(''),
    aadhaarDocument: Joi.string().uri().allow(''),
    panDocument: Joi.string().uri().allow(''),
    kycVerified: Joi.boolean(),
    sourceLead: objectId,
    assignedTo: objectId,
    status: Joi.string().valid(...CLIENT_STATUSES),
    notes: Joi.string().allow(''),
});

export const updateClientSchema = Joi.object({
    name: Joi.string().trim(),
    phone: phoneSchema,
    email: Joi.string().email().allow(''),
    alternatePhone: phoneSchema.allow(''),
    address: addressSchema,
    dateOfBirth: Joi.date().allow(null),
    aadhaarNumber: Joi.string().trim().allow(''),
    panNumber: Joi.string().trim().uppercase().allow(''),
    aadhaarDocument: Joi.string().uri().allow(''),
    panDocument: Joi.string().uri().allow(''),
    kycVerified: Joi.boolean(),
    sourceLead: objectId,
    assignedTo: objectId,
    status: Joi.string().valid(...CLIENT_STATUSES),
    notes: Joi.string().allow(''),
}).min(1);

export const uploadClientDocumentsSchema = Joi.object({
    aadhaarDocument: Joi.string().uri().optional(),
    panDocument: Joi.string().uri().optional(),
    kycVerified: Joi.boolean().optional(),
    notes: Joi.string().allow('').optional(),
}).or('aadhaarDocument', 'panDocument', 'kycVerified', 'notes');
