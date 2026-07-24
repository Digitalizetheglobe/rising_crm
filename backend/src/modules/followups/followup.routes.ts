import { Router } from 'express';
import { protect } from '../../middleware/auth.middleware';
import { allowRoles } from '../../middleware/role.middleware';
import { validate } from '../../middleware/validate.middleware';
import {
    createFollowUp,
    getAllFollowUps,
    getFollowUpById,
    getFollowUpStats,
    updateFollowUp,
    completeFollowUp,
    rescheduleFollowUp,
    cancelFollowUp,
} from './followup.controller';
import {
    createFollowUpSchema,
    updateFollowUpSchema,
    completeFollowUpSchema,
    rescheduleFollowUpSchema,
} from './followup.validation';

const router = Router();

router.use(protect);

// Stats
router.get('/stats', allowRoles('SUPER_ADMIN', 'ADMIN', 'SALES_MANAGER', 'SALES_EXECUTIVE', 'FINANCE_MANAGER', 'VIEWER'), getFollowUpStats);

// CRUD
router.post(
    '/',
    allowRoles('SUPER_ADMIN', 'ADMIN', 'SALES_MANAGER', 'SALES_EXECUTIVE'),
    validate(createFollowUpSchema),
    createFollowUp
);

router.get('/', getAllFollowUps);

router.get('/:id', getFollowUpById);

router.put(
    '/:id',
    allowRoles('SUPER_ADMIN', 'ADMIN', 'SALES_MANAGER', 'SALES_EXECUTIVE'),
    validate(updateFollowUpSchema),
    updateFollowUp
);

// Actions
router.patch(
    '/:id/complete',
    allowRoles('SUPER_ADMIN', 'ADMIN', 'SALES_MANAGER', 'SALES_EXECUTIVE'),
    validate(completeFollowUpSchema),
    completeFollowUp
);

router.patch(
    '/:id/reschedule',
    allowRoles('SUPER_ADMIN', 'ADMIN', 'SALES_MANAGER', 'SALES_EXECUTIVE'),
    validate(rescheduleFollowUpSchema),
    rescheduleFollowUp
);

router.patch(
    '/:id/cancel',
    allowRoles('SUPER_ADMIN', 'ADMIN', 'SALES_MANAGER'),
    cancelFollowUp
);

export default router;