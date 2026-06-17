import mongoose, { Document, Schema } from 'mongoose';
import { MetaPlatform } from './metaWebhook.constants';

export interface IMetaWebhookEvent extends Document {
  eventId: string;
  leadgenId: string;
  adId: string;
  formId: string;
  pageId: string;
  platform: MetaPlatform;
  rawPayload: Record<string, any>;
  processedAt: Date;
  status: 'success' | 'failed' | 'unmatched';
  enquiryId?: mongoose.Types.ObjectId;
  errorMessage?: string;
  createdAt: Date;
}

const MetaWebhookEventSchema = new Schema<IMetaWebhookEvent>(
  {
    eventId: { type: String, required: true, unique: true, sparse: true },
    leadgenId: { type: String, required: true, index: true },
    adId: { type: String, required: true, index: true },
    formId: { type: String, required: true },
    pageId: { type: String, required: true },
    platform: { type: String, enum: ['facebook', 'instagram'] },
    rawPayload: { type: Schema.Types.Mixed, required: true },
    processedAt: { type: Date, default: () => new Date() },
    status: {
      type: String,
      enum: ['success', 'failed', 'unmatched'],
      index: true,
    },
    enquiryId: { type: Schema.Types.ObjectId, ref: 'Enquiry' },
    errorMessage: { type: String, trim: true },
  },
  { timestamps: true }
);

MetaWebhookEventSchema.index({ status: 1, createdAt: -1 });
MetaWebhookEventSchema.index({ enquiryId: 1 });

export const MetaWebhookEvent = mongoose.model<IMetaWebhookEvent>(
  'MetaWebhookEvent',
  MetaWebhookEventSchema
);
