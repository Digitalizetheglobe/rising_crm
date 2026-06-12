
import { Router } from 'express';
import { protect } from '../../middleware/auth.middleware';
import { allowRoles } from '../../middleware/role.middleware';
import { getDashboard, getBookingsTrend, getRevenueByProject } from './dashboard.controller';

const router = Router();

router.get(
  '/',
  protect,
  allowRoles('SUPER_ADMIN', 'ADMIN', 'SALES_MANAGER', 'SALES_EXECUTIVE', 'FINANCIAL_EXECUTIVE'),
  getDashboard
);

router.get(
  '/bookings-trend',
  protect,
  allowRoles('SUPER_ADMIN', 'ADMIN', 'SALES_MANAGER', 'FINANCIAL_EXECUTIVE'),
  getBookingsTrend
);

router.get(
  '/revenue-by-project',
  protect,
  allowRoles('SUPER_ADMIN', 'ADMIN', 'SALES_MANAGER', 'FINANCIAL_EXECUTIVE'),
  getRevenueByProject
);

export default router;