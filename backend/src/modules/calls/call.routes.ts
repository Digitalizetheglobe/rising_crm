import { Router } from 'express';
import { protect } from '../../middleware/auth.middleware';
import { allowRoles } from '../../middleware/role.middleware';
import { validate } from '../../middleware/validate.middleware';
import {
    createCall,
    deleteCall,
    getAllCalls,
    getCallById,
    getCallsByClient,
    getCallStats,
    updateCall,
} from './call.controller';
import { createCallSchema, updateCallSchema } from './call.validation';

const router = Router();

router.use(protect);

// Stats
router.get(
    '/stats',
    allowRoles('SUPER_ADMIN', 'ADMIN', 'SALES_MANAGER', 'SALES_EXECUTIVE'),
    getCallStats
);

// Calls by client (used by client detail page)
router.get(
    '/client/:clientId',
    allowRoles('SUPER_ADMIN', 'ADMIN', 'SALES_MANAGER', 'SALES_EXECUTIVE'),
    getCallsByClient
);

// CRUD
router.post(
    '/',
    allowRoles('SUPER_ADMIN', 'ADMIN', 'SALES_MANAGER', 'SALES_EXECUTIVE'),
    validate(createCallSchema),
    createCall
);

router.get(
    '/',
    allowRoles('SUPER_ADMIN', 'ADMIN', 'SALES_MANAGER', 'SALES_EXECUTIVE', 'FINANCE_MANAGER', 'VIEWER'),
    getAllCalls
);

router.get(
    '/:id',
    allowRoles('SUPER_ADMIN', 'ADMIN', 'SALES_MANAGER', 'SALES_EXECUTIVE', 'FINANCE_MANAGER', 'VIEWER'),
    getCallById
);

router.put(
    '/:id',
    allowRoles('SUPER_ADMIN', 'ADMIN', 'SALES_MANAGER', 'SALES_EXECUTIVE'),
    validate(updateCallSchema),
    updateCall
);

router.delete(
    '/:id',
    allowRoles('SUPER_ADMIN', 'ADMIN'),
    deleteCall
);

export default router;