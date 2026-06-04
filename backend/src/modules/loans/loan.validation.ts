import Joi from 'joi';
import { LOAN_STATUSES } from './loan.constants';

export const createLoanSchema = Joi.object({
  booking: Joi.string().hex().length(24).required().messages({
    'any.required': 'Booking ID is required',
  }),
  client: Joi.string().hex().length(24).required().messages({
    'any.required': 'Client ID is required',
  }),
  bankName: Joi.string().trim().min(2).max(100).required().messages({
    'any.required': 'Bank name is required',
  }),
  loanAmount: Joi.number().min(1).required().messages({
    'number.min': 'Loan amount must be greater than 0',
    'any.required': 'Loan amount is required',
  }),
  applicationDate: Joi.date().iso().required().messages({
    'any.required': 'Application date is required',
  }),
  interestRate: Joi.number().min(0).max(100).optional().allow(null),
  tenureMonths: Joi.number().integer().min(1).max(360).optional().allow(null),
  bankContact: Joi.string().trim().max(100).optional().allow('', null),
  remarks: Joi.string().trim().max(500).optional().allow(''),
});

export const updateLoanSchema = Joi.object({
  bankName: Joi.string().trim().min(2).max(100).optional(),
  loanAmount: Joi.number().min(1).optional(),
  applicationDate: Joi.date().iso().optional(),
  interestRate: Joi.number().min(0).max(100).optional().allow(null),
  tenureMonths: Joi.number().integer().min(1).max(360).optional().allow(null),
  bankContact: Joi.string().trim().max(100).optional().allow('', null),
  remarks: Joi.string().trim().max(500).optional().allow(''),
}).min(1).messages({
  'object.min': 'At least one field is required to update',
});

export const updateLoanStatusSchema = Joi.object({
  status: Joi.string()
    .valid(...LOAN_STATUSES)
    .required()
    .messages({
      'any.only': `Status must be one of: ${LOAN_STATUSES.join(', ')}`,
      'any.required': 'Status is required',
    }),
  sanctionedAmount: Joi.number().min(0).optional().allow(null),
  approvalDate: Joi.date().iso().optional().allow(null),
  disbursementDate: Joi.date().iso().optional().allow(null),
  emiAmount: Joi.number().min(0).optional().allow(null),
  note: Joi.string().trim().max(500).optional().allow(''),
});