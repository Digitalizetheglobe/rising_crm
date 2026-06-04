import mongoose, { Document, Schema } from 'mongoose';
import { PROJECT_STATUSES, PROJECT_TYPES, ProjectStatus, ProjectType } from './project.constants';

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
    createdBy: mongoose.Types.ObjectId;
}

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
        createdBy:      { type: Schema.Types.ObjectId, ref: 'User', required: true },
    },
    { timestamps: true }
);

ProjectSchema.index({ name: 1 });
ProjectSchema.index({ status: 1 });
ProjectSchema.index({ type: 1 });
ProjectSchema.index({ location: 1 });
ProjectSchema.index({ createdAt: -1 });

export const Project = mongoose.model<IProject>('Project', ProjectSchema);