import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth.middleware';
import {
  getDashboardSummaryService,
  getFilteredNewLeadsService,
  getFilteredFollowUpsService,
  getFilteredSiteVisitsService,
  getFilteredBookingsService,
  getActiveCampaignsService,
  getProjectInventoryService,
  getEmployeePerformanceService,
  getTopPerformersService,
  getTodayVisitsService,
  getPaymentAlertsService,
  getLeadTrendsService,
  getLeadFunnelService,
  getLeadSourcesService,
  getTodayWorkService,
  getRemindersService,
  getRevenueByProjectService,
  getBookingsTrendService,
} from './dashboard.service';

const ok = (res: Response, data: unknown, message = 'Success') =>
  res.status(200).json({ success: true, message, data });

const fail = (res: Response, error: any) =>
  res.status(error.statusCode || 500).json({ success: false, message: error.message });

// GET /api/v1/dashboard/summary?projectId=&dateRange=&startDate=&endDate=
export const getDashboardSummary = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const data = await getDashboardSummaryService(
      req.user!.UserId,
      req.user!.role,
      req.query.projectId as string | undefined,
      req.query.dateRange as string | undefined,
      req.query.startDate as string | undefined,
      req.query.endDate as string | undefined
    );
    ok(res, data, 'Dashboard summary fetched');
  } catch (error: any) { fail(res, error); }
};

// GET /api/v1/dashboard/new-leads?projectId=&dateRange=&startDate=&endDate=
export const getFilteredNewLeads = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const data = await getFilteredNewLeadsService(
      req.user!.UserId,
      req.user!.role,
      req.query.projectId as string | undefined,
      req.query.dateRange as string | undefined,
      req.query.startDate as string | undefined,
      req.query.endDate as string | undefined
    );
    ok(res, data, 'Filtered new leads fetched');
  } catch (error: any) { fail(res, error); }
};

// GET /api/v1/dashboard/followups-filtered?projectId=&dateRange=&startDate=&endDate=
export const getFilteredFollowUps = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const data = await getFilteredFollowUpsService(
      req.user!.UserId,
      req.user!.role,
      req.query.projectId as string | undefined,
      req.query.dateRange as string | undefined,
      req.query.startDate as string | undefined,
      req.query.endDate as string | undefined
    );
    ok(res, data, 'Filtered follow ups fetched');
  } catch (error: any) { fail(res, error); }
};

// GET /api/v1/dashboard/site-visits-filtered?projectId=&dateRange=&startDate=&endDate=
export const getFilteredSiteVisits = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const data = await getFilteredSiteVisitsService(
      req.user!.UserId,
      req.user!.role,
      req.query.projectId as string | undefined,
      req.query.dateRange as string | undefined,
      req.query.startDate as string | undefined,
      req.query.endDate as string | undefined
    );
    ok(res, data, 'Filtered site visits fetched');
  } catch (error: any) { fail(res, error); }
};

// GET /api/v1/dashboard/bookings-filtered?projectId=&dateRange=&startDate=&endDate=
export const getFilteredBookings = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const data = await getFilteredBookingsService(
      req.user!.UserId,
      req.user!.role,
      req.query.projectId as string | undefined,
      req.query.dateRange as string | undefined,
      req.query.startDate as string | undefined,
      req.query.endDate as string | undefined
    );
    ok(res, data, 'Filtered bookings fetched');
  } catch (error: any) { fail(res, error); }
};

// GET /api/v1/dashboard/active-campaigns?projectId=
export const getActiveCampaigns = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const data = await getActiveCampaignsService(
      req.query.projectId as string | undefined
    );
    ok(res, data, 'Active campaigns fetched');
  } catch (error: any) { fail(res, error); }
};

// GET /api/v1/dashboard/project-inventory?projectId=
export const getProjectInventory = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const data = await getProjectInventoryService(req.query.projectId as string | undefined);
    ok(res, data, 'Project inventory fetched');
  } catch (error: any) { fail(res, error); }
};

// GET /api/v1/dashboard/employee-performance
export const getEmployeePerformance = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const data = await getEmployeePerformanceService(req.user!.UserId, req.user!.role);
    ok(res, data, 'Employee performance fetched');
  } catch (error: any) { fail(res, error); }
};

// GET /api/v1/dashboard/top-performers?limit=
export const getTopPerformers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const limit = parseInt(req.query.limit as string) || 5;
    const data = await getTopPerformersService(req.user!.UserId, req.user!.role, limit);
    ok(res, data, 'Top performers fetched');
  } catch (error: any) { fail(res, error); }
};

// GET /api/v1/dashboard/today-visits?projectId=
export const getTodayVisits = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const data = await getTodayVisitsService(
      req.user!.UserId,
      req.user!.role,
      req.query.projectId as string | undefined
    );
    ok(res, data, "Today's site visits fetched");
  } catch (error: any) { fail(res, error); }
};

// GET /api/v1/dashboard/payment-alerts?limit=
export const getPaymentAlerts = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const data = await getPaymentAlertsService(req.user!.UserId, req.user!.role, limit);
    ok(res, data, 'Payment alerts fetched');
  } catch (error: any) { fail(res, error); }
};

// GET /api/v1/dashboard/lead-trends?period=daily|weekly|monthly&range=30&projectId=
export const getLeadTrends = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const period = (req.query.period as 'daily' | 'weekly' | 'monthly') || 'daily';
    const range = parseInt(req.query.range as string) || 30;
    const data = await getLeadTrendsService(
      req.user!.UserId,
      req.user!.role,
      period,
      range,
      req.query.projectId as string | undefined
    );
    ok(res, data, 'Lead trends fetched');
  } catch (error: any) { fail(res, error); }
};

// GET /api/v1/dashboard/lead-funnel?projectId=
export const getLeadFunnel = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const data = await getLeadFunnelService(
      req.user!.UserId,
      req.user!.role,
      req.query.projectId as string | undefined
    );
    ok(res, data, 'Lead funnel fetched');
  } catch (error: any) { fail(res, error); }
};

// GET /api/v1/dashboard/lead-sources?period=thisMonth|lastMonth|allTime&projectId=
export const getLeadSources = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const period = (req.query.period as 'thisMonth' | 'lastMonth' | 'allTime') || 'thisMonth';
    const data = await getLeadSourcesService(
      req.user!.UserId,
      req.user!.role,
      period,
      req.query.projectId as string | undefined
    );
    ok(res, data, 'Lead sources fetched');
  } catch (error: any) { fail(res, error); }
};

// GET /api/v1/dashboard/today-work
export const getTodayWork = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const data = await getTodayWorkService(req.user!.UserId);
    ok(res, data, "Today's work fetched");
  } catch (error: any) { fail(res, error); }
};

// GET /api/v1/dashboard/reminders?hours=4
export const getReminders = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const hours = parseInt(req.query.hours as string) || 4;
    const data = await getRemindersService(req.user!.UserId, hours);
    ok(res, data, 'Reminders fetched');
  } catch (error: any) { fail(res, error); }
};

// GET /api/v1/dashboard/revenue-by-project
export const getRevenueByProject = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const data = await getRevenueByProjectService();
    ok(res, data, 'Revenue by project fetched');
  } catch (error: any) { fail(res, error); }
};

// GET /api/v1/dashboard/bookings-trend
export const getBookingsTrend = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const data = await getBookingsTrendService(req.user!.UserId, req.user!.role);
    ok(res, data, 'Bookings trend fetched');
  } catch (error: any) { fail(res, error); }
};
