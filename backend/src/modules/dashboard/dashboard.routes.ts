
import { Router } from 'express';
import { protect } from '../../middleware/auth.middleware';
import { allowRoles } from '../../middleware/role.middleware';
import { getDashboard, getBookingsTrend, getRevenueByProject } from './dashboard.controller';

const router = Router();

router.get(
  '/',
  protect,
  allowRoles('SUPER_ADMIN', 'ADMIN', 'SALES_MANAGER'),
  getDashboard
);

router.get(
  '/bookings-trend',
  protect,
  allowRoles('SUPER_ADMIN', 'ADMIN', 'SALES_MANAGER'),
  getBookingsTrend
);

router.get(
  '/revenue-by-project',
  protect,
  allowRoles('SUPER_ADMIN', 'ADMIN', 'SALES_MANAGER', 'FINANCIAL_EXECUTIVE'),
  getRevenueByProject
);

export default router;