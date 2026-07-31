import Notification from './notification.model';
import { NotificationType, NotificationRefModel } from './notification.constants';
import { getTenantId } from '../../middleware/tenant.middleware';

interface CreateNotificationPayload {
  UserId: string;
  title: string;
  message: string;
  type: NotificationType;
  refId?: string;
  refModel?: NotificationRefModel;
}

// Core helper — call this from any service to fire a notification
export const createNotification = async (payload: CreateNotificationPayload) => {
  try {
    const tenantId = getTenantId();
    await Notification.create({ ...payload, tenantId });
  } catch (error) {
    // Notifications should NEVER crash the main operation — swallow the error and log
    console.error('[Notification] Failed to create notification:', error);
  }
};

// Notify multiple users at once (e.g. notify manager + executive on reassignment)
export const createNotifications = async (payloads: CreateNotificationPayload[]) => {
  try {
    const tenantId = getTenantId();
    const data = payloads.map((p) => ({ ...p, tenantId }));
    await Notification.bulkCreate(data);
  } catch (error) {
    console.error('[Notification] Failed to create bulk notifications:', error);
  }
};

// ─── Pre-built notification factories ─────────────────────────────────────────
// Import and call these directly from lead.service, followup.service, etc.

export const notifyLeadAssigned = (UserId: string, leadId: string, clientName: string) =>
  createNotification({
    UserId,
    title: 'New Lead Assigned',
    message: `You have been assigned a new lead: ${clientName}`,
    type: 'Lead',
    refId: leadId,
    refModel: 'Lead',
  });

export const notifyLeadStatusChanged = (
  UserId: string,
  leadId: string,
  clientName: string,
  status: string
) =>
  createNotification({
    UserId,
    title: 'Lead Status Updated',
    message: `Lead "${clientName}" has been moved to ${status}`,
    type: 'Lead',
    refId: leadId,
    refModel: 'Lead',
  });

export const notifyFollowUpScheduled = (UserId: string, followUpId: string, dueDate: Date) =>
  createNotification({
    UserId,
    title: 'Follow-Up Scheduled',
    message: `A follow-up has been scheduled for ${new Date(dueDate).toLocaleDateString('en-IN')}`,
    type: 'FollowUp',
    refId: followUpId,
    refModel: 'FollowUp',
  });

export const notifyFollowUpDue = (UserId: string, followUpId: string, clientName: string) =>
  createNotification({
    UserId,
    title: 'Follow-Up Due Soon',
    message: `Your follow-up with ${clientName} is due within 2 hours`,
    type: 'FollowUp',
    refId: followUpId,
    refModel: 'FollowUp',
  });

export const notifyPaymentDue = (UserId: string, paymentId: string, clientName: string, amount: number) =>
  createNotification({
    UserId,
    title: 'Payment Due',
    message: `Payment of ₹${amount.toLocaleString('en-IN')} from ${clientName} is due today`,
    type: 'Payment',
    refId: paymentId,
    refModel: 'Payment',
  });

export const notifyPaymentOverdue = (UserId: string, paymentId: string, clientName: string, amount: number) =>
  createNotification({
    UserId,
    title: 'Payment Overdue',
    message: `Payment of ₹${amount.toLocaleString('en-IN')} from ${clientName} is overdue`,
    type: 'Payment',
    refId: paymentId,
    refModel: 'Payment',
  });

export const notifyPaymentReceived = (UserId: string, paymentId: string, clientName: string, amount: number) =>
  createNotification({
    UserId,
    title: 'Payment Received',
    message: `Payment of ₹${amount.toLocaleString('en-IN')} from ${clientName} has been recorded`,
    type: 'Payment',
    refId: paymentId,
    refModel: 'Payment',
  });

export const notifySiteVisitScheduled = (UserId: string, followUpId: string, clientName: string, date: Date) =>
  createNotification({
    UserId,
    title: 'Site Visit Scheduled',
    message: `Site visit with ${clientName} scheduled for ${new Date(date).toLocaleDateString('en-IN')}`,
    type: 'SiteVisit',
    refId: followUpId,
    refModel: 'FollowUp',
  });