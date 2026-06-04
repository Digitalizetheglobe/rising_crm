import mongoose, { Document, Schema } from 'mongoose';
import { FEEDBACK_CATEGORIES, FEEDBACK_STATUSES, FeedbackCategory, FeedbackRating, FeedbackStatus } from './feedback.constants';

export interface IFeedback extends Document {
    client: mongoose.Types.ObjectId;
    loggedBy: mongoose.Types.ObjectId;
    rating: FeedbackRating;
    category: FeedbackCategory;
    comment?: string;
    status: FeedbackStatus;
    resolvedBy?: mongoose.Types.ObjectId;
    resolvedAt?: Date;
    resolvedNote?: string;
}

const FeedbackSchema = new Schema<IFeedback>(
    {
        client:       { type: Schema.Types.ObjectId, ref: 'Client', required: true },
        loggedBy:     { type: Schema.Types.ObjectId, ref: 'User', required: true },
        rating:       { type: Number, enum: [1, 2, 3, 4, 5], required: true },
        category:     { type: String, enum: FEEDBACK_CATEGORIES, required: true },
        comment:      { type: String, trim: true },
        status:       { type: String, enum: FEEDBACK_STATUSES, default: 'OPEN' },
        resolvedBy:   { type: Schema.Types.ObjectId, ref: 'User' },
        resolvedAt:   { type: Date },
        resolvedNote: { type: String, trim: true },
    },
    { timestamps: true }
);

FeedbackSchema.index({ client: 1 });
FeedbackSchema.index({ loggedBy: 1 });
FeedbackSchema.index({ rating: 1 });
FeedbackSchema.index({ category: 1 });
FeedbackSchema.index({ status: 1 });
FeedbackSchema.index({ createdAt: -1 });

export const Feedback = mongoose.model<IFeedback>('Feedback', FeedbackSchema);