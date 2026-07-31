
import Joi from 'joi';
import { PROJECT_STATUSES, PROJECT_TYPES } from './project.constants';

const urlSchema = Joi.string().uri().trim();

const metaCampaignSchema = Joi.object({
    campaignName:      Joi.string().trim().required(),
    campaignId:        Joi.string().trim().required(),
    adSetName:         Joi.string().trim().required(),
    adSetId:           Joi.string().trim().required(),
    adName:            Joi.string().trim().required(),
    adId:              Joi.string().trim().required(),
    formName:          Joi.string().trim().required(),
    formId:            Joi.string().trim().required(),
    platform:          Joi.string().valid('facebook', 'instagram').required(),
    defaultAssigneeId: Joi.string().uuid().optional(),
    isActive:          Joi.boolean().default(true),
});

export const createProjectSchema = Joi.object({
    name:           Joi.string().trim().required(),
    location:       Joi.string().trim().required(),
    description:    Joi.string().trim().allow('').optional(),
    type:           Joi.string().valid(...PROJECT_TYPES).required(),
    totalUnits:     Joi.number().integer().min(1).required(),
    amenities:      Joi.array().items(Joi.string().trim()).optional(),
    launchDate:     Joi.date().optional(),
    completionDate: Joi.date().greater(Joi.ref('launchDate')).optional(),
    status:         Joi.string().valid(...PROJECT_STATUSES).optional(),
    images:         Joi.array().items(urlSchema).optional(),
    brochure:       urlSchema.optional(),
    reraNumber:     Joi.string().trim().optional(),
    metaCampaigns:  Joi.array().items(metaCampaignSchema).optional(),
});

export const updateProjectSchema = Joi.object({
    name:           Joi.string().trim(),
    location:       Joi.string().trim(),
    description:    Joi.string().trim().allow(''),
    type:           Joi.string().valid(...PROJECT_TYPES),
    totalUnits:     Joi.number().integer().min(1),
    amenities:      Joi.array().items(Joi.string().trim()),
    launchDate:     Joi.date(),
    completionDate: Joi.date(),
    status:         Joi.string().valid(...PROJECT_STATUSES),
    brochure:       urlSchema.allow(''),
    reraNumber:     Joi.string().trim().allow(''),
    images:         Joi.array().items(urlSchema).optional(),
    metaCampaigns:  Joi.array().items(metaCampaignSchema).optional(),
}).min(1);

export const updateProjectImagesSchema = Joi.object({
    images:   Joi.array().items(urlSchema).optional(),
    brochure: urlSchema.optional(),
}).or('images', 'brochure');