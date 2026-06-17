import mongoose, { Document, Schema } from 'mongoose';
import { PROJECT_STATUSES, PROJECT_TYPES, ProjectStatus, ProjectType } from './project.constants';

export interface IMetaCampaign {
    campaignName: string;
    campaignId: string;
    adSetName: string;
    adSetId: string;
    adName: string;
    adId: string;
    formName: string;
    formId: string;
    platform: 'facebook' | 'instagram';
    defaultAssigneeId?: mongoose.Types.ObjectId;
    isActive: boolean;
    createdAt?: Date;
}
export interface IProject extends Document {
    name: string;
    location: string;
    description?: string;
    type: ProjectType;
    amenities: string[];
    totalUnits: number;
    launchDate?: Date;
    completionDate?: Date;
    status: ProjectStatus;
    images: string[];
    brochure?: string;
    reraNumber?: string;
    metaCampaigns?: IMetaCampaign[];
    createdBy: mongoose.Types.ObjectId;
}

const MetaCampaignSchema = new Schema<IMetaCampaign>(
    {
        campaignName:        { type: String, required: true, trim: true },
        campaignId:          { type: String, required: true, trim: true },
        adSetName:           { type: String, required: true, trim: true },
        adSetId:             { type: String, required: true, trim: true },
        adName:              { type: String, required: true, trim: true },
        adId:                { type: String, required: true, trim: true },
        formName:            { type: String, required: true, trim: true },
        formId:              { type: String, required: true, trim: true },
        platform:            { type: String, enum: ['facebook', 'instagram'], required: true },
        defaultAssigneeId:   { type: Schema.Types.ObjectId, ref: 'User' },
        isActive:            { type: Boolean, default: true },
        createdAt:           { type: Date, default: () => new Date() },
    },
    { _id: true }
);

const ProjectSchema = new Schema<IProject>(
    {
        name:           { type: String, required: true, trim: true },
        location:       { type: String, required: true, trim: true },
        description:    { type: String, trim: true },
        type:           { type: String, enum: PROJECT_TYPES, required: true },
        amenities:      { type: [String], default: [] },
        totalUnits:     { type: Number, required: true, min: 1 },
        launchDate:     { type: Date },
        completionDate: { type: Date },
        status:         { type: String, enum: PROJECT_STATUSES, default: 'UPCOMING' },
        images:         { type: [String], default: [] },
        brochure:       { type: String, trim: true },
        reraNumber:     { type: String, trim: true },
        metaCampaigns:  { type: [MetaCampaignSchema], default: [] },
        createdBy:      { type: Schema.Types.ObjectId, ref: 'User', required: true },
    },
    { timestamps: true }
);

ProjectSchema.index({ name: 1 });
ProjectSchema.index({ status: 1 });
ProjectSchema.index({ type: 1 });
ProjectSchema.index({ location: 1 });
ProjectSchema.index({ createdAt: -1 });
ProjectSchema.index({ 'metaCampaigns.adId': 1, 'metaCampaigns.isActive': 1 }, { sparse: true });
ProjectSchema.index({ 'metaCampaigns.adId': 1 }, { sparse: true, unique: true });

export const Project = mongoose.model<IProject>('Project', ProjectSchema);