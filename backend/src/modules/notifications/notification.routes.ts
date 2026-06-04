
import { Router } from 'express';
import { protect } from '../../middleware/auth.middleware';
import { allowRoles } from '../../middleware/role.middleware';
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearReadNotifications,
  getNotificationsByUserId,
} from './notification.controller';

const router = Router();

// Every authenticated user manages their own notifications
router.get('/',                protect, getNotifications);
router.patch('/read-all',      protect, markAllAsRead);           // must be before /:id
router.delete('/clear-read',   protect, clearReadNotifications);  // must be before /:id
router.patch('/:id/read',      protect, markAsRead);
router.delete('/:id',          protect, deleteNotification);

// Admin can inspect any user's notifications
router.get(
  '/user/:UserId',
  protect,
  allowRoles('SUPER_ADMIN', 'ADMIN'),
  getNotificationsByUserId
);

export default router;