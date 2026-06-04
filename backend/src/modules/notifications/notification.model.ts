import mongoose, { Document, Schema } from 'mongoose';
import {
  NotificationType,
  NotificationRefModel,
  NOTIFICATION_TYPES,
  NOTIFICATION_REF_MODELS,
} from './notification.constants';

export interface INotification extends Document {
  UserId: mongoose.Types.ObjectId;
  title: string;
  message: string;
  type: NotificationType;
  isRead: boolean;
  refId?: mongoose.Types.ObjectId;
  refModel?: NotificationRefModel;
  createdAt: Date;
  updatedAt: Date;
}

const notificationSchema = new Schema<INotification>(
  {
    UserId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: NOTIFICATION_TYPES,
      required: true,
      index: true,
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
    refId: {
      type: Schema.Types.ObjectId,
      default: null,
    },
    refModel: {
      type: String,
      enum: NOTIFICATION_REF_MODELS,
      default: null,
    },
  },
  { timestamps: true }
);

// Primary query: get all notifications for a user, unread first
notificationSchema.index({ UserId: 1, isRead: 1, createdAt: -1 });

export const Notification = mongoose.model<INotification>('Notification', notificationSchema);