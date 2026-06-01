import { Router } from 'express';
import { protect } from '../../middleware/auth.middleware';
import { allowRoles } from '../../middleware/role.middleware';
import { validate } from '../../middleware/validate.middleware';
import {
    createEnquiry,
    getAllEnquiries,
    getEnquiryById,
    getEnquiryStats,
    updateEnquiry,
    updateEnquiryStatus,
    assignEnquiry,
    convertToLead,
    deleteEnquiry,
} from './enquiry.controller';
import {
    createEnquirySchema,
    updateEnquirySchema,
    updateStatusSchema,
    assignEnquirySchema,
    convertToLeadSchema,
} from './enquiry.validation';

const router = Router();

// All routes require login
router.use(protect);

// ── Stats (before /:id so it doesn't get caught as an id param) ───────────────
router.get(
    '/stats',
    allowRoles('SUPER_ADMIN', 'ADMIN', 'SALES_MANAGER'),
    getEnquiryStats
);

// ── CRUD ──────────────────────────────────────────────────────────────────────

// Create — anyone except VIEWER and FINANCE_MANAGER
router.post(
    '/',
    allowRoles('SUPER_ADMIN', 'ADMIN', 'SALES_MANAGER', 'SALES_EXECUTIVE'),
    validate(createEnquirySchema),
    createEnquiry
);

// List — all roles can view (SALES_EXECUTIVE filtered to own in controller)
router.get('/', getAllEnquiries);

// Single
router.get('/:id', getEnquiryById);

// Update details
router.put(
    '/:id',
    allowRoles('SUPER_ADMIN', 'ADMIN', 'SALES_MANAGER', 'SALES_EXECUTIVE'),
    validate(updateEnquirySchema),
    updateEnquiry
);

// Update status (Pending → Contacted → Qualified → Rejected)
router.patch(
    '/:id/status',
    allowRoles('SUPER_ADMIN', 'ADMIN', 'SALES_MANAGER', 'SALES_EXECUTIVE'),
    validate(updateStatusSchema),
    updateEnquiryStatus
);

// Assign to Sales Executive — Manager and above only
router.patch(
    '/:id/assign',
    allowRoles('SUPER_ADMIN', 'ADMIN', 'SALES_MANAGER'),
    validate(assignEnquirySchema),
    assignEnquiry
);

// Convert Qualified Enquiry to Lead — Manager and above only
router.post(
    '/:id/convert',
    allowRoles('SUPER_ADMIN', 'ADMIN', 'SALES_MANAGER'),
    validate(convertToLeadSchema),
    convertToLead
);

// Delete — Admin and above only
router.delete(
    '/:id',
    allowRoles('SUPER_ADMIN', 'ADMIN'),
    deleteEnquiry
);

export default router;