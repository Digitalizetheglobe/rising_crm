import Joi from 'joi';
import { BOOKING_TYPES, BOOKING_STATUSES, PAYMENT_MODES } from './booking.constants';

export const createBookingSchema = Joi.object({
  client: Joi.string().hex().length(24).required().messages({
    'any.required': 'Client is required',
  }),
  unit: Joi.string().hex().length(24).required().messages({
    'any.required': 'Unit is required',
  }),
  bookingType: Joi.string()
    .valid(...BOOKING_TYPES)
    .required()
    .messages({
      'any.only': `Booking type must be one of: ${BOOKING_TYPES.join(', ')}`,
      'any.required': 'Booking type is required',
    }),
  bookingDate: Joi.date().iso().required().messages({
    'any.required': 'Booking date is required',
  }),
  totalAmount: Joi.number().min(0).required().messages({
    'any.required': 'Total amount is required',
  }),
  discountAmount: Joi.number().min(0).default(0).optional(),
  bookingAmount: Joi.number().min(0).required().messages({
    'any.required': 'Booking amount (token) is required',
  }),
  paymentMode: Joi.string()
    .valid(...PAYMENT_MODES)
    .required()
    .messages({
      'any.only': `Payment mode must be one of: ${PAYMENT_MODES.join(', ')}`,
      'any.required': 'Payment mode is required',
    }),
  remarks: Joi.string().trim().max(500).optional().allow(''),
});

export const updateBookingSchema = Joi.object({
  bookingType: Joi.string().valid(...BOOKING_TYPES).optional(),
  bookingDate: Joi.date().iso().optional(),
  totalAmount: Joi.number().min(0).optional(),
  discountAmount: Joi.number().min(0).optional(),
  bookingAmount: Joi.number().min(0).optional(),
  paymentMode: Joi.string().valid(...PAYMENT_MODES).optional(),
  remarks: Joi.string().trim().max(500).optional().allow(''),
}).min(1).messages({
  'object.min': 'At least one field is required to update',
});

export const cancelBookingSchema = Joi.object({
  cancellationReason: Joi.string().trim().min(5).max(500).required().messages({
    'any.required': 'Cancellation reason is required',
    'string.min': 'Please provide a more detailed cancellation reason',
  }),
});