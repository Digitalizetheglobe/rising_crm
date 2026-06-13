import { Router } from 'express';
import { protect } from '../../middleware/auth.middleware';
import { allowRoles } from '../../middleware/role.middleware';
import {
  getDashboardSummary,
  getProjectInventory,
  getEmployeePerformance,
  getTopPerformers,
  getTodayVisits,
  getPaymentAlerts,
  getLeadTrends,
  getLeadFunnel,
  getLeadSources,
  getTodayWork,
  getReminders,
  getRevenueByProject,
  getBookingsTrend,
} from './dashboard.controller';

const router = Router();

const allRoles = allowRoles(
  'SUPER_ADMIN',
  'ADMIN',
  'SALES_MANAGER',
  'SALES_EXECUTIVE',
  'FINANCIAL_EXECUTIVE'
);
const managerRoles = allowRoles(
  'SUPER_ADMIN',
  'ADMIN',
  'SALES_MANAGER',
  'FINANCIAL_EXECUTIVE'
);

// ── Core stat cards & project filter ──────────────────────────────────────────
router.get('/summary', protect, allRoles, getDashboardSummary);
router.get('/project-inventory', protect, allRoles, getProjectInventory);

// ── Team & performance ────────────────────────────────────────────────────────
router.get('/employee-performance', protect, managerRoles, getEmployeePerformance);
router.get('/top-performers', protect, managerRoles, getTopPerformers);

// ── Operational data ──────────────────────────────────────────────────────────
router.get('/today-visits', protect, allRoles, getTodayVisits);
router.get('/payment-alerts', protect, allRoles, getPaymentAlerts);

// ── Analytics ─────────────────────────────────────────────────────────────────
router.get('/lead-trends', protect, allRoles, getLeadTrends);
router.get('/lead-funnel', protect, allRoles, getLeadFunnel);
router.get('/lead-sources', protect, allRoles, getLeadSources);
router.get('/bookings-trend', protect, managerRoles, getBookingsTrend);
router.get('/revenue-by-project', protect, managerRoles, getRevenueByProject);

// ── Personal work & reminders (for logged-in user) ────────────────────────────
router.get('/today-work', protect, allRoles, getTodayWork);
router.get('/reminders', protect, allRoles, getReminders);

export default router;
