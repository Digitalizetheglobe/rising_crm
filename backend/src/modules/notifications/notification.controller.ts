
import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth.middleware';
import {
  getNotificationsService,
  markAsReadService,
  markAllAsReadService,
  deleteNotificationService,
  clearReadNotificationsService,
  getNotificationsByUserIdService,
} from './notification.service';

// GET /api/v1/notifications
export const getNotifications = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await getNotificationsService(req.query as any, req.user!.UserId);
    res.status(200).json({ success: true, message: 'Notifications fetched successfully', data: result });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
};

// PATCH /api/v1/notifications/:id/read
export const markAsRead = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const notification = await markAsReadService(req.params.id as string, req.user!.UserId);
    res.status(200).json({ success: true, message: 'Notification marked as read', data: notification });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
};

// PATCH /api/v1/notifications/read-all
export const markAllAsRead = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await markAllAsReadService(req.user!.UserId);
    res.status(200).json({ success: true, message: `${result.markedRead} notification(s) marked as read`, data: result });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
};

// DELETE /api/v1/notifications/:id
export const deleteNotification = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await deleteNotificationService(req.params.id as string, req.user!.UserId);
    res.status(200).json({ success: true, message: 'Notification deleted', data: result });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
};

// DELETE /api/v1/notifications/clear-read
export const clearReadNotifications = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await clearReadNotificationsService(req.user!.UserId);
    res.status(200).json({ success: true, message: `${result.cleared} read notification(s) cleared`, data: result });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
};

// GET /api/v1/notifications/user/:UserId  (Admin only)
export const getNotificationsByUserId = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await getNotificationsByUserIdService(req.params.UserId as string, req.query as any);
    res.status(200).json({ success: true, message: 'User notifications fetched successfully', data: result });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
};