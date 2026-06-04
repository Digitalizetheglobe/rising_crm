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
router.get('/stats', allowRoles('SUPER_ADMIN', 'ADMIN', 'SALES_MANAGER', 'SALES_EXECUTIVE'), getLeadStats);

// ── CRUD ──────────────────────────────────────────────────────────────────────
router.post(
    '/',
    allowRoles('SUPER_ADMIN', 'ADMIN', 'SALES_MANAGER', 'SALES_EXECUTIVE'),
    validate(createLeadSchema),
    createLead
);

router.get('/', getAllLeads);

router.get('/:id', getLeadById);

router.get('/:id/activity', getLeadActivity);

router.put(
    '/:id',
    allowRoles('SUPER_ADMIN', 'ADMIN', 'SALES_MANAGER', 'SALES_EXECUTIVE'),
    validate(updateLeadSchema),
    updateLead
);

// Status update — executive can update their own, manager can update any
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