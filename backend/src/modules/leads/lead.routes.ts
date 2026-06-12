import { Router } from 'express';
import { protect } from '../../middleware/auth.middleware';
import { allowRoles } from '../../middleware/role.middleware';
import { validate } from '../../middleware/validate.middleware';
import {
    createLead,
    getAllLeads,
    getLeadById,
    getLeadStats,
    getLeadActivity,
    updateLead,
    updateLeadStatus,
    assignLead,
    deleteLead,
} from './lead.controller';
import {
    createLeadSchema,
    updateLeadSchema,
    updateLeadStatusSchema,
    assignLeadSchema,
} from './lead.validation';

const router = Router();

router.use(protect);

// ── Stats & special routes (before /:id) ─────────────────────────────────────
router.get('/stats', allowRoles('SUPER_ADMIN', 'ADMIN', 'SALES_MANAGER'), getLeadStats);

router.post(
    '/',
    allowRoles('SUPER_ADMIN', 'ADMIN', 'SALES_MANAGER'),
    validate(createLeadSchema),
    createLead
);

router.get('/', allowRoles('SUPER_ADMIN', 'ADMIN', 'SALES_MANAGER', 'SALES_EXECUTIVE'), getAllLeads);

router.get('/:id', allowRoles('SUPER_ADMIN', 'ADMIN', 'SALES_MANAGER', 'SALES_EXECUTIVE'), getLeadById);

router.get('/:id/activity', allowRoles('SUPER_ADMIN', 'ADMIN', 'SALES_MANAGER', 'SALES_EXECUTIVE'), getLeadActivity);

router.put(
    '/:id',
    allowRoles('SUPER_ADMIN', 'ADMIN', 'SALES_MANAGER', 'SALES_EXECUTIVE'),
    validate(updateLeadSchema),
    updateLead
);

router.patch(
    '/:id/status',
    allowRoles('SUPER_ADMIN', 'ADMIN', 'SALES_MANAGER', 'SALES_EXECUTIVE'),
    validate(updateLeadStatusSchema),
    updateLeadStatus
);

// Assign / Reassign — manager and above only
router.patch(
    '/:id/assign',
    allowRoles('SUPER_ADMIN', 'ADMIN', 'SALES_MANAGER'),
    validate(assignLeadSchema),
    assignLead
);

// Delete — admin and above only
router.delete(
    '/:id',
    allowRoles('SUPER_ADMIN', 'ADMIN'),
    deleteLead
);

export default router;