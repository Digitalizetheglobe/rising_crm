
import { Router } from 'express';
import { protect } from '../../middleware/auth.middleware';
import { allowRoles } from '../../middleware/role.middleware';
import { validate } from '../../middleware/validate.middleware';
import {
  createPaymentSchema,
  updatePaymentSchema,
  markPaidSchema,
  waivePaymentSchema,
} from './payment.validation';
import {
  createPayment,
  getPayments,
  getPaymentStats,
  getPaymentById,
  updatePayment,
  markPaymentPaid,
  waivePayment,
  deletePayment,
} from './payment.controller';

const router = Router();

router.get(
  '/stats',
  protect,
  allowRoles('SUPER_ADMIN', 'ADMIN', 'SALES_MANAGER', 'SALES_EXECUTIVE', 'FINANCE_MANAGER'),
  getPaymentStats
);

router.post(
  '/',
  protect,
  allowRoles('SUPER_ADMIN', 'ADMIN', 'SALES_MANAGER', 'FINANCE_MANAGER'),
  validate(createPaymentSchema),
  createPayment
);

router.get(
  '/',
  protect,
  allowRoles('SUPER_ADMIN', 'ADMIN', 'SALES_MANAGER', 'SALES_EXECUTIVE', 'FINANCE_MANAGER', 'VIEWER'),
  getPayments
);

router.get(
  '/:id',
  protect,
  allowRoles('SUPER_ADMIN', 'ADMIN', 'SALES_MANAGER', 'SALES_EXECUTIVE', 'FINANCE_MANAGER', 'VIEWER'),
  getPaymentById
);

router.put(
  '/:id',
  protect,
  allowRoles('SUPER_ADMIN', 'ADMIN', 'FINANCE_MANAGER'),
  validate(updatePaymentSchema),
  updatePayment
);

router.patch(
  '/:id/pay',
  protect,
  allowRoles('SUPER_ADMIN', 'ADMIN', 'FINANCE_MANAGER'),
  validate(markPaidSchema),
  markPaymentPaid
);

router.patch(
  '/:id/waive',
  protect,
  allowRoles('SUPER_ADMIN', 'ADMIN'),
  validate(waivePaymentSchema),
  waivePayment
);

router.delete(
  '/:id',
  protect,
  allowRoles('SUPER_ADMIN', 'ADMIN'),
  deletePayment
);

export default router;