
import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth.middleware';
import {
  getDashboardService,
  getBookingsTrendService,
  getRevenueByProjectService,
} from './dashboard.service';

// GET /api/v1/dashboard
export const getDashboard = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const data = await getDashboardService(req.user!.UserId, req.user!.role);
    res.status(200).json({ success: true, message: 'Dashboard data fetched successfully', data });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
};

// GET /api/v1/dashboard/bookings-trend
export const getBookingsTrend = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const data = await getBookingsTrendService(req.user!.UserId, req.user!.role);
    res.status(200).json({ success: true, message: 'Bookings trend fetched successfully', data });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
};

// GET /api/v1/dashboard/revenue-by-project
export const getRevenueByProject = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const data = await getRevenueByProjectService();
    res.status(200).json({ success: true, message: 'Revenue by project fetched successfully', data });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
};