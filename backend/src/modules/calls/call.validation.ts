import Joi from 'joi';
import { CALL_OUTCOMES, CALL_DIRECTIONS, CALL_PURPOSES } from './call.constants';

const objectId = Joi.string().hex().length(24);

export const createCallSchema = Joi.object({
    client:       objectId.required(),
    callDate:     Joi.date().max('now').required(),
    duration:     Joi.number().integer().min(0).optional(),
    direction:    Joi.string().valid(...CALL_DIRECTIONS).required(),
    purpose:      Joi.string().valid(...CALL_PURPOSES).required(),
    outcome:      Joi.string().valid(...CALL_OUTCOMES).required(),
    notes:        Joi.string().trim().allow('').optional(),
    nextCallDate: Joi.date().greater('now').optional(),
});

export const updateCallSchema = Joi.object({
    callDate:     Joi.date().max('now'),
    duration:     Joi.number().integer().min(0),
    direction:    Joi.string().valid(...CALL_DIRECTIONS),
    purpose:      Joi.string().valid(...CALL_PURPOSES),
    outcome:      Joi.string().valid(...CALL_OUTCOMES),
    notes:        Joi.string().trim().allow(''),
    nextCallDate: Joi.date().allow(null),
}).min(1);