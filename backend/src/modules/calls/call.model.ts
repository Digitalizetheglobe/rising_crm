import mongoose, { Document, Schema } from 'mongoose';
import { CALL_OUTCOMES, CALL_DIRECTIONS, CALL_PURPOSES, CallOutcome, CallDirection, CallPurpose } from './call.constants';

export interface ICall extends Document {
    client: mongoose.Types.ObjectId;
    loggedBy: mongoose.Types.ObjectId;
    callDate: Date;
    duration?: number; // in seconds
    direction: CallDirection;
    purpose: CallPurpose;
    outcome: CallOutcome;
    notes?: string;
    nextCallDate?: Date;
}

const CallSchema = new Schema<ICall>(
    {
        client: { type: Schema.Types.ObjectId, ref: 'Client', required: true },
        loggedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        callDate: { type: Date, required: true },
        duration: { type: Number, min: 0 }, // seconds
        direction: { type: String, enum: CALL_DIRECTIONS, required: true },
        purpose: { type: String, enum: CALL_PURPOSES, required: true },
        outcome: { type: String, enum: CALL_OUTCOMES, required: true },
        notes: { type: String, trim: true },
        nextCallDate: { type: Date },
    },
    { timestamps: true }
);

CallSchema.index({ client: 1 });
CallSchema.index({ loggedBy: 1 });
CallSchema.index({ callDate: -1 });
CallSchema.index({ outcome: 1 });
CallSchema.index({ nextCallDate: 1 });
CallSchema.index({ createdAt: -1 });

export const Call = mongoose.model<ICall>('Call', CallSchema);