
import { Router } from 'express';
import { protect } from '../../middleware/auth.middleware';
import { allowRoles } from '../../middleware/role.middleware';
import { validate } from '../../middleware/validate.middleware';
import { createBookingSchema, updateBookingSchema, cancelBookingSchema } from './booking.validation';
import {
  createBooking,
  getBookings,
  getBookingStats,
  getBookingById,
  updateBooking,
  cancelBooking,
  completeBooking,
} from './booking.controller';

const router = Router();

router.get(
  '/stats',
  protect,
  allowRoles('SUPER_ADMIN', 'ADMIN', 'SALES_MANAGER', 'FINANCE_MANAGER'),
  getBookingStats
);

router.post(
  '/',
  protect,
  allowRoles('SUPER_ADMIN', 'ADMIN', 'SALES_MANAGER', 'FINANCE_MANAGER'),
  validate(createBookingSchema),
  createBooking
);

router.get(
  '/',
  protect,
  allowRoles('SUPER_ADMIN', 'ADMIN', 'SALES_MANAGER', 'SALES_EXECUTIVE', 'FINANCE_MANAGER', 'VIEWER'),
  getBookings
);

router.get(
  '/:id',
  protect,
  allowRoles('SUPER_ADMIN', 'ADMIN', 'SALES_MANAGER', 'SALES_EXECUTIVE', 'FINANCE_MANAGER', 'VIEWER'),
  getBookingById
);

router.put(
  '/:id',
  protect,
  allowRoles('SUPER_ADMIN', 'ADMIN', 'SALES_MANAGER', 'FINANCE_MANAGER'),
  validate(updateBookingSchema),
  updateBooking
);

router.patch(
  '/:id/cancel',
  protect,
  allowRoles('SUPER_ADMIN', 'ADMIN', 'SALES_MANAGER', 'FINANCE_MANAGER'),
  validate(cancelBookingSchema),
  cancelBooking
);

router.patch(
  '/:id/complete',
  protect,
  allowRoles('SUPER_ADMIN', 'ADMIN', 'FINANCE_MANAGER'),
  completeBooking
);

export default router;