
import { Router } from 'express';
import { protect } from '../../middleware/auth.middleware';
import { allowRoles } from '../../middleware/role.middleware';
import { validate } from '../../middleware/validate.middleware';
import { createLoanSchema, updateLoanSchema, updateLoanStatusSchema } from './loan.validation';
import {
  createLoan,
  getLoans,
  getLoanStats,
  getLoanById,
  updateLoan,
  updateLoanStatus,
  deleteLoan,
} from './loan.controller';

const router = Router();

router.get(
  '/stats',
  protect,
  allowRoles('SUPER_ADMIN', 'ADMIN', 'SALES_MANAGER', 'SALES_EXECUTIVE', 'FINANCE_MANAGER'),
  getLoanStats
);

router.post(
  '/',
  protect,
  allowRoles('SUPER_ADMIN', 'ADMIN', 'SALES_MANAGER', 'FINANCE_MANAGER'),
  validate(createLoanSchema),
  createLoan
);

router.get(
  '/',
  protect,
  allowRoles('SUPER_ADMIN', 'ADMIN', 'SALES_MANAGER', 'SALES_EXECUTIVE', 'FINANCE_MANAGER', 'VIEWER'),
  getLoans
);

router.get(
  '/:id',
  protect,
  allowRoles('SUPER_ADMIN', 'ADMIN', 'SALES_MANAGER', 'SALES_EXECUTIVE', 'FINANCE_MANAGER', 'VIEWER'),
  getLoanById
);

router.put(
  '/:id',
  protect,
  allowRoles('SUPER_ADMIN', 'ADMIN', 'FINANCE_MANAGER'),
  validate(updateLoanSchema),
  updateLoan
);

router.patch(
  '/:id/status',
  protect,
  allowRoles('SUPER_ADMIN', 'ADMIN', 'FINANCE_MANAGER'),
  validate(updateLoanStatusSchema),
  updateLoanStatus
);

router.delete(
  '/:id',
  protect,
  allowRoles('SUPER_ADMIN', 'ADMIN'),
  deleteLoan
);

export default router;