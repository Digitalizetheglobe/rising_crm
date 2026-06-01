// import mongoose, { Schema, Document } from 'mongoose';

// export interface IFollowUp extends Document {
//     lead:        mongoose.Types.ObjectId;
//     scheduledAt: Date;
//     type:        string;
//     notes?:      string;
//     status:      string;
//     createdBy:   mongoose.Types.ObjectId;
//     assignedTo:  mongoose.Types.ObjectId;
// }

// const FollowUpSchema = new Schema<IFollowUp>(
//     {
//         lead:        { type: Schema.Types.ObjectId, ref: 'Lead', required: true },
//         scheduledAt: { type: Date, required: true },
//         type:        { type: String, enum: ['Call', 'Email', 'WhatsApp', 'Site Visit', 'Meeting'], required: true },
//         notes:       { type: String, trim: true },
//         status:      { type: String, enum: ['Scheduled', 'Completed', 'Missed', 'Rescheduled'], default: 'Scheduled' },
//         createdBy:   { type: Schema.Types.ObjectId, ref: 'User', required: true },
//         assignedTo:  { type: Schema.Types.ObjectId, ref: 'User', required: true },
//     },
//     { timestamps: true }
// );

// FollowUpSchema.index({ lead: 1 });
// FollowUpSchema.index({ assignedTo: 1, status: 1 });
// FollowUpSchema.index({ scheduledAt: 1 });

// export const FollowUp = mongoose.model<IFollowUp>('FollowUp', FollowUpSchema);
import mongoose, { Schema, Document } from 'mongoose';

export const FOLLOWUP_TYPES = ['Call', 'Email', 'WhatsApp', 'Site Visit', 'Meeting', 'Other'] as const;
export const FOLLOWUP_STATUSES = ['SCHEDULED', 'PENDING', 'COMPLETED', 'RESCHEDULED', 'MISSED', 'CANCELLED'] as const;

export type FollowUpType = typeof FOLLOWUP_TYPES[number];
export type FollowUpStatus = typeof FOLLOWUP_STATUSES[number];

export interface IFollowUp extends Document {
    // Relations
    lead:       mongoose.Types.ObjectId;
    assignedTo: mongoose.Types.ObjectId;
    createdBy:  mongoose.Types.ObjectId;

    // Follow-up details
    type:        FollowUpType;
    status:      FollowUpStatus;
    scheduledAt: Date;
    completedAt?: Date;

    // Notes
    notes?:   string;
    outcome?: string; // what happened after the follow-up

    // Rescheduling
    rescheduledFrom?: mongoose.Types.ObjectId; // ref to previous followup
    rescheduledAt?:   Date;
    rescheduleReason?: string;

    // Reminder tracking
    reminderSent:   boolean;
    reminderSentAt?: Date;
}

const FollowUpSchema = new Schema<IFollowUp>(
    {
        // Relations
        lead: {
            type:     Schema.Types.ObjectId,
            ref:      'Lead',
            required: true,
        },
        assignedTo: {
            type:     Schema.Types.ObjectId,
            ref:      'User',
            required: true,
        },
        createdBy: {
            type:     Schema.Types.ObjectId,
            ref:      'User',
            required: true,
        },

        // Follow-up details
        type: {
            type:     String,
            enum:     FOLLOWUP_TYPES,
            required: true,
        },
        status: {
            type:    String,
            enum:    FOLLOWUP_STATUSES,
            default: 'SCHEDULED',
        },
        scheduledAt: {
            type:     Date,
            required: true,
        },
        completedAt: { type: Date },

        // Notes
        notes:   { type: String, trim: true },
        outcome: { type: String, trim: true },

        // Rescheduling
        rescheduledFrom:  { type: Schema.Types.ObjectId, ref: 'FollowUp' },
        rescheduledAt:    { type: Date },
        rescheduleReason: { type: String, trim: true },

        // Reminder tracking
        reminderSent:   { type: Boolean, default: false },
        reminderSentAt: { type: Date },
    },
    {
        timestamps: true,
    }
);

// Indexes
FollowUpSchema.index({ lead: 1 });
FollowUpSchema.index({ assignedTo: 1 });
FollowUpSchema.index({ status: 1 });
FollowUpSchema.index({ scheduledAt: 1 });
FollowUpSchema.index({ assignedTo: 1, status: 1 });
FollowUpSchema.index({ scheduledAt: 1, status: 1, reminderSent: 1 }); // for cron job

export const FollowUp = mongoose.model<IFollowUp>('FollowUp', FollowUpSchema);