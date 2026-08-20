import { Router } from 'express';
import { protect } from '../../middleware/auth.middleware';
import { allowRoles } from '../../middleware/role.middleware';
import {
  getDashboardSummary,
  getFilteredNewLeads,
  getFilteredFollowUps,
  getFilteredSiteVisits,
  getFilteredBookings,
  getActiveCampaigns,
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
router.get('/new-leads', protect, allRoles, getFilteredNewLeads);
router.get('/followups-filtered', protect, allRoles, getFilteredFollowUps);
router.get('/site-visits-filtered', protect, allRoles, getFilteredSiteVisits);
router.get('/bookings-filtered', protect, allRoles, getFilteredBookings);
router.get('/active-campaigns', protect, allRoles, getActiveCampaigns);

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
