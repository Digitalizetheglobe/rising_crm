import { Router } from 'express';
import { protect } from '../../middleware/auth.middleware';
import { allowRoles } from '../../middleware/role.middleware';
import { validate } from '../../middleware/validate.middleware';
import {
    createFeedback,
    deleteFeedback,
    getAllFeedbacks,
    getFeedbackById,
    getFeedbacksByClient,
    getFeedbackStats,
    resolveFeedback,
    updateFeedback,
} from './feedback.controller';
import { createFeedbackSchema, resolveFeedbackSchema, updateFeedbackSchema } from './feedback.validation';

const router = Router();

router.use(protect);

router.get(
    '/stats',
    allowRoles('SUPER_ADMIN', 'ADMIN', 'SALES_MANAGER', 'SALES_EXECUTIVE'),
    getFeedbackStats
);

router.get(
    '/client/:clientId',
    allowRoles('SUPER_ADMIN', 'ADMIN', 'SALES_MANAGER', 'SALES_EXECUTIVE', 'VIEWER'),
    getFeedbacksByClient
);

router.post(
    '/',
    allowRoles('SUPER_ADMIN', 'ADMIN', 'SALES_MANAGER', 'SALES_EXECUTIVE'),
    validate(createFeedbackSchema),
    createFeedback
);

router.get(
    '/',
    allowRoles('SUPER_ADMIN', 'ADMIN', 'SALES_MANAGER', 'SALES_EXECUTIVE', 'VIEWER'),
    getAllFeedbacks
);

router.get(
    '/:id',
    allowRoles('SUPER_ADMIN', 'ADMIN', 'SALES_MANAGER', 'SALES_EXECUTIVE', 'VIEWER'),
    getFeedbackById
);

router.put(
    '/:id',
    allowRoles('SUPER_ADMIN', 'ADMIN', 'SALES_MANAGER', 'SALES_EXECUTIVE'),
    validate(updateFeedbackSchema),
    updateFeedback
);

router.patch(
    '/:id/resolve',
    allowRoles('SUPER_ADMIN', 'ADMIN', 'SALES_MANAGER'),
    validate(resolveFeedbackSchema),
    resolveFeedback
);

router.delete(
    '/:id',
    allowRoles('SUPER_ADMIN', 'ADMIN'),
    deleteFeedback
);

export default router;