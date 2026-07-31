import Joi from 'joi';
import { PAYMENT_STATUSES, PAYMENT_MODES, PAYMENT_TYPES } from './payment.constants';

export const createPaymentSchema = Joi.object({
  booking: Joi.string().uuid().required().messages({
    'any.required': 'Booking ID is required',
  }),
  client: Joi.string().uuid().required().messages({
    'any.required': 'Client ID is required',
  }),
  paymentType: Joi.string()
    .valid(...PAYMENT_TYPES)
    .required()
    .messages({
      'any.only': `Payment type must be one of: ${PAYMENT_TYPES.join(', ')}`,
      'any.required': 'Payment type is required',
    }),
  amount: Joi.number().min(1).required().messages({
    'number.min': 'Amount must be greater than 0',
    'any.required': 'Amount is required',
  }),
  dueDate: Joi.date().iso().required().messages({
    'any.required': 'Due date is required',
  }),
  notes: Joi.string().trim().max(500).optional().allow(''),
});

export const markPaidSchema = Joi.object({
  paidDate: Joi.date().iso().required().messages({
    'any.required': 'Paid date is required',
  }),
  paymentMode: Joi.string()
    .valid(...PAYMENT_MODES)
    .required()
    .messages({
      'any.only': `Payment mode must be one of: ${PAYMENT_MODES.join(', ')}`,
      'any.required': 'Payment mode is required',
    }),
  receiptNumber: Joi.string().trim().max(50).optional().allow(''),
  transactionId: Joi.string().trim().max(100).optional().allow(''),
  notes: Joi.string().trim().max(500).optional().allow(''),
});

export const updatePaymentSchema = Joi.object({
  paymentType: Joi.string().valid(...PAYMENT_TYPES).optional(),
  amount: Joi.number().min(1).optional(),
  dueDate: Joi.date().iso().optional(),
  notes: Joi.string().trim().max(500).optional().allow(''),
}).min(1).messages({
  'object.min': 'At least one field is required to update',
});

export const waivePaymentSchema = Joi.object({
  notes: Joi.string().trim().min(5).max(500).required().messages({
    'any.required': 'Reason for waiving payment is required',
    'string.min': 'Please provide a more detailed reason',
  }),
});