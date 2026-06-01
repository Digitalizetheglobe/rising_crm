// import mongoose from 'mongoose';
// export const Lead = mongoose.model('Lead', new mongoose.Schema({}, { strict: false }));
import mongoose, { Schema, Document } from 'mongoose';
import {
    LEAD_STATUSES,
    LEAD_SOURCES,
    LEAD_PRIORITIES,
    BUDGET_RANGES,
    PROPERTY_TYPES,
    LeadStatus,
    LeadSource,
    LeadPriority,
} from './lead.constants';

// ── Activity Log Entry ─────────────────────────────────────────────────────────
export interface ILeadActivity {
    action: string;
    description: string;
    performedBy: mongoose.Types.ObjectId;
    performedAt: Date;
    previousStatus?: LeadStatus;
    newStatus?: LeadStatus;
    metadata?: Record<string, any>;
}

// ── Reassignment History Entry ─────────────────────────────────────────────────
export interface IReassignmentHistory {
    fromExecutive: mongoose.Types.ObjectId;
    toExecutive:   mongoose.Types.ObjectId;
    reassignedBy:  mongoose.Types.ObjectId;
    reassignedAt:  Date;
    reason?:       string;
}

// ── Lead Document Interface ────────────────────────────────────────────────────
export interface ILead extends Document {
    // Basic Info
    name:  string;
    phone: string;
    email?: string;

    // Lead Details
    source:            LeadSource;
    status:            LeadStatus;
    priority:          LeadPriority;
    budgetRange?:      string;
    propertyType?:     string;
    preferredLocation?: string;

    // Project & Unit Interest
    interestedProject?: mongoose.Types.ObjectId;
    interestedUnit?:    mongoose.Types.ObjectId;

    // Assignment
    assignedTo?:  mongoose.Types.ObjectId;
    assignedBy?:  mongoose.Types.ObjectId;
    assignedAt?:  Date;

    // Follow Up
    nextFollowUpDate?: Date;
    lastContactedAt?:  Date;

    // Conversion tracking
    enquiryId?: mongoose.Types.ObjectId;  // if created from an enquiry

    // Lost / Duplicate reason
    lostReason?:      string;
    duplicateOfLead?: mongoose.Types.ObjectId;

    // Activity & Reassignment logs
    activityLog:        ILeadActivity[];
    reassignmentHistory: IReassignmentHistory[];

    // Notes
    notes?: string;

    // Meta
    createdBy: mongoose.Types.ObjectId;
}

// ── Sub-schemas ────────────────────────────────────────────────────────────────
const LeadActivitySchema = new Schema<ILeadActivity>(
    {
        action:         { type: String, required: true },
        description:    { type: String, required: true },
        performedBy:    { type: Schema.Types.ObjectId, ref: 'User', required: true },
        performedAt:    { type: Date, default: Date.now },
        previousStatus: { type: String, enum: LEAD_STATUSES },
        newStatus:      { type: String, enum: LEAD_STATUSES },
        metadata:       { type: Schema.Types.Mixed },
    },
    { _id: true }
);

const ReassignmentHistorySchema = new Schema<IReassignmentHistory>(
    {
        fromExecutive: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        toExecutive:   { type: Schema.Types.ObjectId, ref: 'User', required: true },
        reassignedBy:  { type: Schema.Types.ObjectId, ref: 'User', required: true },
        reassignedAt:  { type: Date, default: Date.now },
        reason:        { type: String },
    },
    { _id: true }
);

// ── Main Lead Schema ───────────────────────────────────────────────────────────
const LeadSchema = new Schema<ILead>(
    {
        // Basic Info
        name:  { type: String, required: true, trim: true },
        phone: { type: String, required: true, trim: true },
        email: { type: String, trim: true, lowercase: true },

        // Lead Details
        source: {
            type: String,
            enum: LEAD_SOURCES,
            required: true,
        },
        status: {
            type: String,
            enum: LEAD_STATUSES,
            default: 'NEW',
        },
        priority: {
            type: String,
            enum: LEAD_PRIORITIES,
            default: 'Medium',
        },
        budgetRange:       { type: String, enum: BUDGET_RANGES },
        propertyType:      { type: String, enum: PROPERTY_TYPES },
        preferredLocation: { type: String, trim: true },

        // Project & Unit
        interestedProject: { type: Schema.Types.ObjectId, ref: 'Project' },
        interestedUnit:    { type: Schema.Types.ObjectId, ref: 'Unit' },

        // Assignment
        assignedTo: { type: Schema.Types.ObjectId, ref: 'User' },
        assignedBy: { type: Schema.Types.ObjectId, ref: 'User' },
        assignedAt: { type: Date },

        // Follow Up
        nextFollowUpDate: { type: Date },
        lastContactedAt:  { type: Date },

        // Conversion tracking
        enquiryId: { type: Schema.Types.ObjectId, ref: 'Enquiry' },

        // Lost / Duplicate
        lostReason:       { type: String, trim: true },
        duplicateOfLead:  { type: Schema.Types.ObjectId, ref: 'Lead' },

        // Logs
        activityLog:         { type: [LeadActivitySchema], default: [] },
        reassignmentHistory: { type: [ReassignmentHistorySchema], default: [] },

        // Notes
        notes: { type: String, trim: true },

        // Meta
        createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    },
    {
        timestamps: true,
    }
);

// ── Indexes ────────────────────────────────────────────────────────────────────
LeadSchema.index({ status: 1 });
LeadSchema.index({ assignedTo: 1 });
LeadSchema.index({ source: 1 });
LeadSchema.index({ priority: 1 });
LeadSchema.index({ phone: 1 });
LeadSchema.index({ createdAt: -1 });
LeadSchema.index({ nextFollowUpDate: 1 });
LeadSchema.index({ assignedTo: 1, status: 1 }); // compound — most common query

export const Lead = mongoose.model<ILead>('Lead', LeadSchema);