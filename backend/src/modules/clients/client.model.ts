import mongoose, { Document, Schema } from 'mongoose';
import { CLIENT_STATUSES, ClientStatus } from './client.constants';

interface IAddress {
    line1?: string;
    line2?: string;
    city?: string;
    state?: string;
    country?: string;
    pincode?: string;
}

export interface IClientActivity {
    action: string;
    description: string;
    performedBy: mongoose.Types.ObjectId;
    performedAt: Date;
    metadata?: Record<string, unknown>;
}

export interface IClient extends Document {
    name: string;
    phone: string;
    email?: string;
    alternatePhone?: string;
    address?: IAddress;
    dateOfBirth?: Date;

    aadhaarNumber?: string;
    panNumber?: string;
    aadhaarDocument?: string;
    panDocument?: string;
    kycVerified: boolean;

    sourceLead?: mongoose.Types.ObjectId;
    assignedTo?: mongoose.Types.ObjectId;
    createdBy: mongoose.Types.ObjectId;

    status: ClientStatus;
    notes?: string;
    activityLog: IClientActivity[];
}

const AddressSchema = new Schema<IAddress>(
    {
        line1: { type: String, trim: true },
        line2: { type: String, trim: true },
        city: { type: String, trim: true },
        state: { type: String, trim: true },
        country: { type: String, trim: true },
        pincode: { type: String, trim: true },
    },
    { _id: false }
);

const ClientActivitySchema = new Schema<IClientActivity>(
    {
        action: { type: String, required: true },
        description: { type: String, required: true },
        performedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        performedAt: { type: Date, default: Date.now },
        metadata: { type: Schema.Types.Mixed },
    },
    { _id: true }
);

const ClientSchema = new Schema<IClient>(
    {
        name: { type: String, required: true, trim: true },
        phone: { type: String, required: true, trim: true },
        email: { type: String, trim: true, lowercase: true },
        alternatePhone: { type: String, trim: true },
        address: { type: AddressSchema },
        dateOfBirth: { type: Date },

        aadhaarNumber: { type: String, trim: true },
        panNumber: { type: String, trim: true, uppercase: true },
        aadhaarDocument: { type: String, trim: true },
        panDocument: { type: String, trim: true },
        kycVerified: { type: Boolean, default: false },

        sourceLead: { type: Schema.Types.ObjectId, ref: 'Lead' },
        assignedTo: { type: Schema.Types.ObjectId, ref: 'User' },
        createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },

        status: { type: String, enum: CLIENT_STATUSES, default: 'ACTIVE' },
        notes: { type: String, trim: true },
        activityLog: { type: [ClientActivitySchema], default: [] },
    },
    { timestamps: true }
);

ClientSchema.index({ phone: 1 }, { unique: true });
ClientSchema.index({ sourceLead: 1 }, { unique: true, sparse: true });
ClientSchema.index({ assignedTo: 1 });
ClientSchema.index({ status: 1 });
ClientSchema.index({ kycVerified: 1 });
ClientSchema.index({ createdAt: -1 });

export const Client = mongoose.model<IClient>('Client', ClientSchema);
