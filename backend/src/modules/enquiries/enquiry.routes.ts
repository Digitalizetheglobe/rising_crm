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
    allowRoles('SUPER_ADMIN', 'ADMIN', 'SALES_MANAGER', 'SALES_EXECUTIVE', 'FINANCE_MANAGER', 'VIEWER'),
    getEnquiryStats
);

// ── CRUD ──────────────────────────────────────────────────────────────────────

// Create — sales manager and above
router.post(
    '/',
    allowRoles('SUPER_ADMIN', 'ADMIN', 'SALES_MANAGER', 'SALES_EXECUTIVE'),
    validate(createEnquirySchema),
    createEnquiry
);

router.get('/', allowRoles('SUPER_ADMIN', 'ADMIN', 'SALES_MANAGER', 'SALES_EXECUTIVE', 'FINANCE_MANAGER', 'VIEWER'), getAllEnquiries);

router.get('/:id', allowRoles('SUPER_ADMIN', 'ADMIN', 'SALES_MANAGER', 'SALES_EXECUTIVE', 'FINANCE_MANAGER', 'VIEWER'), getEnquiryById);

router.put(
    '/:id',
    allowRoles('SUPER_ADMIN', 'ADMIN', 'SALES_MANAGER', 'SALES_EXECUTIVE'),
    validate(updateEnquirySchema),
    updateEnquiry
);

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
    allowRoles('SUPER_ADMIN', 'ADMIN', 'SALES_MANAGER', 'SALES_EXECUTIVE'),
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