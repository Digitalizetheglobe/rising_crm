import { Op } from 'sequelize';
import Notification from './notification.model';
import { ApiError } from '../../utils/ApiError';
import { getTenantId } from '../../middleware/tenant.middleware';

export const getNotificationsService = async (
  query: {
    type?: string;
    isRead?: string;
    page?: string;
    limit?: string;
  },
  UserId: string
) => {
  const tenantId = getTenantId();
  const page = Math.max(1, parseInt(query.page || '1', 10));
  const limit = Math.min(100, Math.max(1, parseInt(query.limit || '20', 10)));
  const offset = (page - 1) * limit;

  const where: any = { UserId, tenantId };

  if (query.type) where.type = query.type;
  if (query.isRead !== undefined) where.isRead = query.isRead === 'true';

  const { rows, count } = await Notification.findAndCountAll({
    where,
    order: [['createdAt', 'DESC']],
    limit,
    offset,
  });

  const unreadCount = await Notification.count({
    where: { UserId, tenantId, isRead: false },
  });

  return {
    notifications: rows,
    unreadCount,
    pagination: { page, limit, total: count, totalPages: Math.ceil(count / limit) },
  };
};

export const markAsReadService = async (notificationId: string, UserId: string) => {
  const tenantId = getTenantId();
  const notification = await Notification.findOne({ where: { id: notificationId, tenantId } });
  if (!notification) throw new ApiError(404, 'Notification not found');

  if (notification.UserId !== UserId) {
    throw new ApiError(403, 'You can only mark your own notifications as read');
  }

  if (notification.isRead) return notification;

  await notification.update({ isRead: true });
  return notification;
};

export const markAllAsReadService = async (UserId: string) => {
  const tenantId = getTenantId();
  const [affectedCount] = await Notification.update(
    { isRead: true },
    { where: { UserId, tenantId, isRead: false } }
  );

  return { markedRead: affectedCount };
};

export const deleteNotificationService = async (notificationId: string, UserId: string) => {
  const tenantId = getTenantId();
  const notification = await Notification.findOne({ where: { id: notificationId, tenantId } });
  if (!notification) throw new ApiError(404, 'Notification not found');

  if (notification.UserId !== UserId) {
    throw new ApiError(403, 'You can only delete your own notifications');
  }

  await notification.destroy();
  return { deleted: true };
};

export const clearReadNotificationsService = async (UserId: string) => {
  const tenantId = getTenantId();
  const deletedCount = await Notification.destroy({
    where: { UserId, tenantId, isRead: true },
  });

  return { cleared: deletedCount };
};

export const getNotificationsByUserIdService = async (
  targetUserId: string,
  query: { page?: string; limit?: string }
) => {
  const tenantId = getTenantId();
  const page = Math.max(1, parseInt(query.page || '1', 10));
  const limit = Math.min(100, Math.max(1, parseInt(query.limit || '20', 10)));
  const offset = (page - 1) * limit;

  const where = { UserId: targetUserId, tenantId };

  const { rows, count } = await Notification.findAndCountAll({
    where,
    order: [['createdAt', 'DESC']],
    limit,
    offset,
  });

  return {
    notifications: rows,
    pagination: { page, limit, total: count, totalPages: Math.ceil(count / limit) },
  };
};