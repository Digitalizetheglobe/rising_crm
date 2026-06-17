import mongoose, { Schema, Document } from 'mongoose';

export type EnquirySource = 'Website' | 'Advertisement' | 'Referral' | 'Walk-In' | 'Phone' | 'WhatsApp' | 'Email' | 'Social Media' | 'META_ADS' | 'Other';
export type EnquiryStatus = 'Pending' | 'Contacted' | 'Qualified' | 'Converted' | 'Rejected';
export type BudgetRange = 'Under 25L' | '25L-50L' | '50L-1Cr' | '1Cr-2Cr' | 'Above 2Cr';
export type PropertyType = '1BHK' | '2BHK' | '3BHK' | '4+BHK'| 'Villa' | 'Banglow'| 'Plot' | 'Residential'| 'Commercial' | 'Apartment' | 'Shop' | 'Office' ;

export interface IEnquiry extends Document {
    // Basic Info
    name: string;
    phone: string;
    email?: string;

    // Enquiry Details
    source: EnquirySource;
    platform?: 'facebook' | 'instagram';
    status: EnquiryStatus;
    message?: string;
    budgetRange?: BudgetRange;
    propertyType?: PropertyType;
    preferredLocation?: string;

    // Project Interest
    interestedProject?: mongoose.Types.ObjectId;

    // Assignment
    assignedTo?: mongoose.Types.ObjectId;
    assignedBy?: mongoose.Types.ObjectId;
    assignedAt?: Date;

    // Conversion
    isConverted: boolean;
    convertedAt?: Date;
    convertedBy?: mongoose.Types.ObjectId;
    convertedLeadId?: mongoose.Types.ObjectId;

    // Rejection
    rejectedAt?: Date;
    rejectedBy?: mongoose.Types.ObjectId;
    rejectionReason?: string;

    // Meta Ads Integration (for META_ADS source only)
    metaLeadId?: string;
    metaAdId?: string;
    metaFormId?: string;
    rawMetaPayload?: Record<string, any>;

    // Tracking
    createdBy: mongoose.Types.ObjectId;
    lastContactedAt?: Date;
    notes?: string;
}

const EnquirySchema = new Schema<IEnquiry>(
    {
        // Basic Info
        name:  { type: String, required: true, trim: true },
        phone: { type: String, required: true, trim: true },
        email: { type: String, trim: true, lowercase: true },

        // Enquiry Details
        source: {
            type: String,
            enum: ['Website', 'Advertisement', 'Referral', 'Walk-In', 'Phone', 'WhatsApp', 'Email', 'Social Media', 'META_ADS', 'Other'],
            required: true,
        },
        platform:          { type: String, enum: ['facebook', 'instagram'] },
        status: {
            type: String,
            enum: ['Pending', 'Contacted', 'Qualified', 'Converted', 'Rejected'],
            default: 'Pending',
        },
        message:           { type: String, trim: true },
        budgetRange: {
            type: String,
            enum: ['Under 25L', '25L-50L', '50L-1Cr', '1Cr-2Cr', 'Above 2Cr'],
        },
        propertyType: {
            type: String,
            enum: ['1BHK', '2BHK', '3BHK', '4+BHK', 'Villa', 'Banglow', 'Plot', 'Residential', 'Commercial', 'Apartment', 'Shop', 'Office'],
        },
        preferredLocation: { type: String, trim: true },

        // Project Interest
        interestedProject: { type: Schema.Types.ObjectId, ref: 'Project' },

        // Assignment
        assignedTo: { type: Schema.Types.ObjectId, ref: 'User' },
        assignedBy: { type: Schema.Types.ObjectId, ref: 'User' },
        assignedAt: { type: Date },

        // Conversion
        isConverted:      { type: Boolean, default: false },
        convertedAt:      { type: Date },
        convertedBy:      { type: Schema.Types.ObjectId, ref: 'User' },
        convertedLeadId:  { type: Schema.Types.ObjectId, ref: 'Lead' },

        // Rejection
        rejectedAt:       { type: Date },
        rejectedBy:       { type: Schema.Types.ObjectId, ref: 'User' },
        rejectionReason:  { type: String, trim: true },

        // Meta Ads Integration
        metaLeadId:       { type: String, unique: true, sparse: true },
        metaAdId:         { type: String },
        metaFormId:       { type: String },
        rawMetaPayload:   { type: Schema.Types.Mixed },

        // Tracking
        createdBy:        { type: Schema.Types.ObjectId, ref: 'User', required: true },
        lastContactedAt:  { type: Date },
        notes:            { type: String, trim: true },
    },
    {
        timestamps: true,
    }
);

// Indexes for fast queries
EnquirySchema.index({ status: 1 });
EnquirySchema.index({ assignedTo: 1 });
EnquirySchema.index({ source: 1 });
EnquirySchema.index({ phone: 1 });
EnquirySchema.index({ isConverted: 1 });
EnquirySchema.index({ createdAt: -1 });
EnquirySchema.index({ metaLeadId: 1 }, { sparse: true });

export const Enquiry = mongoose.model<IEnquiry>('Enquiry', EnquirySchema);