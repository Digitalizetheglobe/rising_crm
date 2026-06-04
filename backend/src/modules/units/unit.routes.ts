
import { Router } from 'express';
import { protect } from '../../middleware/auth.middleware';
import { allowRoles } from '../../middleware/role.middleware';
import { validate } from '../../middleware/validate.middleware';
import {
  createUnitSchema,
  updateUnitSchema,
  updateUnitStatusSchema,
  bulkCreateUnitsSchema,
} from './unit.validation';
import {
  createUnit,
  bulkCreateUnits,
  getUnits,
  getUnitStats,
  getUnitById,
  updateUnit,
  updateUnitStatus,
  deleteUnit,
} from './unit.controller';

const router = Router();

// ─── Stats (before /:id to avoid route collision) ────────────────────────────
router.get(
  '/stats',
  protect,
  allowRoles('SUPER_ADMIN', 'ADMIN', 'SALES_MANAGER', 'FINANCE_MANAGER'),
  getUnitStats
);

// ─── Bulk Create ──────────────────────────────────────────────────────────────
router.post(
  '/bulk',
  protect,
  allowRoles('SUPER_ADMIN', 'ADMIN'),
  validate(bulkCreateUnitsSchema),
  bulkCreateUnits
);

// ─── CRUD ─────────────────────────────────────────────────────────────────────
router.post(
  '/',
  protect,
  allowRoles('SUPER_ADMIN', 'ADMIN'),
  validate(createUnitSchema),
  createUnit
);

router.get(
  '/',
  protect,
  allowRoles('SUPER_ADMIN', 'ADMIN', 'SALES_MANAGER', 'SALES_EXECUTIVE', 'FINANCE_MANAGER', 'VIEWER'),
  getUnits
);

router.get(
  '/:id',
  protect,
  allowRoles('SUPER_ADMIN', 'ADMIN', 'SALES_MANAGER', 'SALES_EXECUTIVE', 'FINANCE_MANAGER', 'VIEWER'),
  getUnitById
);

router.put(
  '/:id',
  protect,
  allowRoles('SUPER_ADMIN', 'ADMIN'),
  validate(updateUnitSchema),
  updateUnit
);

router.patch(
  '/:id/status',
  protect,
  allowRoles('SUPER_ADMIN', 'ADMIN'),
  validate(updateUnitStatusSchema),
  updateUnitStatus
);

router.delete(
  '/:id',
  protect,
  allowRoles('SUPER_ADMIN', 'ADMIN'),
  deleteUnit
);

export default router;