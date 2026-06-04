
import mongoose from 'mongoose';
import { Notification } from './notification.model';
import { ApiError } from '../../utils/ApiError';

// ─── Get Notifications for logged-in user ─────────────────────────────────────

export const getNotificationsService = async (
  query: {
    type?: string;
    isRead?: string;
    page?: string;
    limit?: string;
  },
  UserId: string
) => {
  const page = Math.max(1, parseInt(query.page || '1', 10));
  const limit = Math.min(100, Math.max(1, parseInt(query.limit || '20', 10)));
  const skip = (page - 1) * limit;

  const filter: Record<string, any> = {
    UserId: new mongoose.Types.ObjectId(UserId),
  };

  if (query.type) filter.type = query.type;
  if (query.isRead !== undefined) filter.isRead = query.isRead === 'true';

  const [notifications, total, unreadCount] = await Promise.all([
    Notification.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Notification.countDocuments(filter),
    Notification.countDocuments({ UserId, isRead: false }),
  ]);

  return {
    notifications,
    unreadCount,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
};

// ─── Mark Single Notification as Read ────────────────────────────────────────

export const markAsReadService = async (notificationId: string, UserId: string) => {
  const notification = await Notification.findById(notificationId);
  if (!notification) throw new ApiError(404, 'Notification not found');

  // Users can only mark their own notifications
  if (notification.UserId.toString() !== UserId) {
    throw new ApiError(403, 'You can only mark your own notifications as read');
  }

  if (notification.isRead) return notification; // already read — no-op

  return Notification.findByIdAndUpdate(
    notificationId,
    { $set: { isRead: true } },
    { new: true }
  );
};

// ─── Mark All as Read ─────────────────────────────────────────────────────────

export const markAllAsReadService = async (UserId: string) => {
  const result = await Notification.updateMany(
    { UserId: new mongoose.Types.ObjectId(UserId), isRead: false },
    { $set: { isRead: true } }
  );

  return { markedRead: result.modifiedCount };
};

// ─── Delete Single Notification ───────────────────────────────────────────────

export const deleteNotificationService = async (notificationId: string, UserId: string) => {
  const notification = await Notification.findById(notificationId);
  if (!notification) throw new ApiError(404, 'Notification not found');

  if (notification.UserId.toString() !== UserId) {
    throw new ApiError(403, 'You can only delete your own notifications');
  }

  await Notification.findByIdAndDelete(notificationId);
  return { deleted: true };
};

// ─── Clear All Read Notifications ────────────────────────────────────────────

export const clearReadNotificationsService = async (UserId: string) => {
  const result = await Notification.deleteMany({
    UserId: new mongoose.Types.ObjectId(UserId),
    isRead: true,
  });

  return { cleared: result.deletedCount };
};

// ─── Admin: Get Notifications for any user ────────────────────────────────────

export const getNotificationsByUserIdService = async (
  targetUserId: string,
  query: { page?: string; limit?: string }
) => {
  const page = Math.max(1, parseInt(query.page || '1', 10));
  const limit = Math.min(100, Math.max(1, parseInt(query.limit || '20', 10)));
  const skip = (page - 1) * limit;

  const filter = { UserId: new mongoose.Types.ObjectId(targetUserId) };

  const [notifications, total] = await Promise.all([
    Notification.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Notification.countDocuments(filter),
  ]);

  return {
    notifications,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
};