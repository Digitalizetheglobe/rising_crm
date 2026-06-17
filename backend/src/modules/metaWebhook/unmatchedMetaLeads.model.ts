import mongoose, { Document, Schema } from 'mongoose';

export interface IUnmatchedMetaLead extends Document {
  leadgenId: string;
  adId: string;
  formId: string;
  pageId: string;
  rawPayload: Record<string, any>;
  status: 'pending' | 'resolved';
  resolvedAt?: Date;
  notes?: string;
  createdAt: Date;
}

const UnmatchedMetaLeadSchema = new Schema<IUnmatchedMetaLead>(
  {
    leadgenId: { type: String, required: true, unique: true, sparse: true },
    adId: { type: String, required: true },
    formId: { type: String, required: true },
    pageId: { type: String, required: true },
    rawPayload: { type: Schema.Types.Mixed, required: true },
    status: {
      type: String,
      enum: ['pending', 'resolved'],
      default: 'pending',
      index: true,
    },
    resolvedAt: { type: Date },
    notes: { type: String, trim: true },
  },
  { timestamps: true }
);

UnmatchedMetaLeadSchema.index({ status: 1, createdAt: -1 });
UnmatchedMetaLeadSchema.index({ adId: 1 });

export const UnmatchedMetaLead = mongoose.model<IUnmatchedMetaLead>(
  'UnmatchedMetaLead',
  UnmatchedMetaLeadSchema
);
