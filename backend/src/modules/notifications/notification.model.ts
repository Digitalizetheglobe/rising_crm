import mongoose, { Schema, Document } from 'mongoose';

export interface INotification extends Document {
    userId:    mongoose.Types.ObjectId;
    title:     string;
    message:   string;
    type:      string;
    refId?:    mongoose.Types.ObjectId;
    refModel?: string;
    isRead:    boolean;
    createdAt: Date;
}

const NotificationSchema = new Schema<INotification>(
    {
        userId:   { type: Schema.Types.ObjectId, ref: 'User', required: true },
        title:    { type: String, required: true },
        message:  { type: String, required: true },
        type:     { type: String, required: true },
        refId:    { type: Schema.Types.ObjectId },
        refModel: { type: String },
        isRead:   { type: Boolean, default: false },
    },
    { timestamps: true }
);

NotificationSchema.index({ userId: 1, isRead: 1 });
NotificationSchema.index({ createdAt: -1 });

export const Notification = mongoose.model<INotification>('Notification', NotificationSchema);
