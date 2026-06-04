import Joi from 'joi';
import { UNIT_TYPES, UNIT_STATUSES, UNIT_FACINGS } from './unit.constants';

export const createUnitSchema = Joi.object({
  project: Joi.string().hex().length(24).required().messages({
    'string.hex': 'Project ID must be a valid ObjectId',
    'any.required': 'Project is required',
  }),
  unitNumber: Joi.string().trim().min(1).max(20).required().messages({
    'any.required': 'Unit number is required',
  }),
  type: Joi.string()
    .valid(...UNIT_TYPES)
    .required()
    .messages({
      'any.only': `Type must be one of: ${UNIT_TYPES.join(', ')}`,
      'any.required': 'Unit type is required',
    }),
  floor: Joi.number().integer().min(0).required().messages({
    'number.min': 'Floor cannot be negative',
    'any.required': 'Floor is required',
  }),
  area: Joi.number().min(1).required().messages({
    'number.min': 'Area must be at least 1 sq ft',
    'any.required': 'Area is required',
  }),
  price: Joi.number().min(0).required().messages({
    'number.min': 'Price cannot be negative',
    'any.required': 'Price is required',
  }),
  status: Joi.string()
    .valid(...UNIT_STATUSES)
    .optional()
    .default('Available'),
  facing: Joi.string()
    .valid(...UNIT_FACINGS)
    .optional()
    .allow(null),
  description: Joi.string().trim().max(500).optional().allow(''),
});

export const updateUnitSchema = Joi.object({
  unitNumber: Joi.string().trim().min(1).max(20).optional(),
  type: Joi.string()
    .valid(...UNIT_TYPES)
    .optional(),
  floor: Joi.number().integer().min(0).optional(),
  area: Joi.number().min(1).optional(),
  price: Joi.number().min(0).optional(),
  facing: Joi.string()
    .valid(...UNIT_FACINGS)
    .optional()
    .allow(null),
  description: Joi.string().trim().max(500).optional().allow(''),
}).min(1).messages({
  'object.min': 'At least one field must be provided to update',
});

// Only Admin+ can change status directly (not via booking flow)
export const updateUnitStatusSchema = Joi.object({
  status: Joi.string()
    .valid(...UNIT_STATUSES)
    .required()
    .messages({
      'any.only': `Status must be one of: ${UNIT_STATUSES.join(', ')}`,
      'any.required': 'Status is required',
    }),
});

export const bulkCreateUnitsSchema = Joi.object({
  project: Joi.string().hex().length(24).required().messages({
    'any.required': 'Project is required',
  }),
  units: Joi.array()
    .items(
      Joi.object({
        unitNumber: Joi.string().trim().min(1).max(20).required(),
        type: Joi.string().valid(...UNIT_TYPES).required(),
        floor: Joi.number().integer().min(0).required(),
        area: Joi.number().min(1).required(),
        price: Joi.number().min(0).required(),
        facing: Joi.string().valid(...UNIT_FACINGS).optional().allow(null),
        description: Joi.string().trim().max(500).optional().allow(''),
      })
    )
    .min(1)
    .max(500)
    .required()
    .messages({
      'array.min': 'At least one unit is required',
      'array.max': 'Cannot bulk create more than 500 units at once',
      'any.required': 'Units array is required',
    }),
});