import mongoose, { Schema, Document } from 'mongoose';

export const SITE_VISIT_STATUSES = ['SCHEDULED', 'PENDING', 'COMPLETED', 'CANCELLED'] as const;
export type SiteVisitStatus = typeof SITE_VISIT_STATUSES[number];

export interface ISiteVisit extends Document {
    lead:       mongoose.Types.ObjectId;
    project?:   mongoose.Types.ObjectId;
    assignedTo: mongoose.Types.ObjectId;
    createdBy:  mongoose.Types.ObjectId;
    
    status:      SiteVisitStatus;
    scheduledAt: Date;
    completedAt?: Date;

    notes?:   string;
    outcome?: string;
}

const SiteVisitSchema = new Schema<ISiteVisit>(
    {
        lead: {
            type:     Schema.Types.ObjectId,
            ref:      'Lead',
            required: true,
        },
        project: {
            type:     Schema.Types.ObjectId,
            ref:      'Project',
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
        status: {
            type:    String,
            enum:    SITE_VISIT_STATUSES,
            default: 'SCHEDULED',
        },
        scheduledAt: {
            type:     Date,
            required: true,
        },
        completedAt: { type: Date },
        notes:   { type: String, trim: true },
        outcome: { type: String, trim: true },
    },
    {
        timestamps: true,
    }
);

SiteVisitSchema.index({ lead: 1 });
SiteVisitSchema.index({ assignedTo: 1 });
SiteVisitSchema.index({ status: 1 });
SiteVisitSchema.index({ scheduledAt: 1 });

export const SiteVisit = mongoose.model<ISiteVisit>('SiteVisit', SiteVisitSchema);
