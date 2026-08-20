import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../../config/sequelize';
import User from '../auth/auth.model';
import Tenant from '../tenants/tenant.model';
import {
    LEAD_STATUSES,
    LEAD_SOURCES,
    LEAD_PRIORITIES,
    BUDGET_RANGES,
    PROPERTY_TYPES,
} from './lead.constants';

export interface LeadAttributes {
    id: string;
    tenantId: string;
    
    // Basic Info
    name: string;
    phone: string;
    email?: string;

    // Lead Details
    source: string;
    status: string;
    priority: string;
    budgetRange?: string;
    propertyType?: string;
    preferredLocation?: string;
    purpose?: string;

    // Project & Unit Interest
    interestedProjectId?: string;
    interestedUnitId?: string;

    // Assignment
    assignedTo?: string;
    assignedBy?: string;
    assignedAt?: Date;

    // Follow Up
    nextFollowUpDate?: Date;
    lastContactedAt?: Date;

    // Conversion tracking
    enquiryId?: string;

    // Lost / Duplicate reason
    lostReason?: string;
    duplicateOfLeadId?: string;

    // Activity & Reassignment logs (Stored as JSONB)
    activityLog: any[];
    reassignmentHistory: any[];

    // Notes
    notes?: string;

    // Meta
    createdBy: string;
    
    createdAt?: Date;
    updatedAt?: Date;
}

export interface LeadCreationAttributes extends Optional<LeadAttributes, 'id' | 'status' | 'priority' | 'activityLog' | 'reassignmentHistory'> {}

class Lead extends Model<LeadAttributes, LeadCreationAttributes> implements LeadAttributes {
    public id!: string;
    public tenantId!: string;
    public name!: string;
    public phone!: string;
    public email!: string;
    public source!: string;
    public status!: string;
    public priority!: string;
    public budgetRange!: string;
    public propertyType!: string;
    public preferredLocation!: string;
    public purpose!: string;
    public interestedProjectId!: string;
    public interestedUnitId!: string;
    public assignedTo!: string;
    public assignedBy!: string;
    public assignedAt!: Date;
    public nextFollowUpDate!: Date;
    public lastContactedAt!: Date;
    public enquiryId!: string;
    public lostReason!: string;
    public duplicateOfLeadId!: string;
    public activityLog!: any[];
    public reassignmentHistory!: any[];
    public notes!: string;
    public createdBy!: string;

    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}

Lead.init(
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        tenantId: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'tenants',
                key: 'id'
            }
        },
        name: { type: DataTypes.STRING, allowNull: false },
        phone: { type: DataTypes.STRING, allowNull: false },
        email: { type: DataTypes.STRING, allowNull: true },
        source: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: { isIn: [LEAD_SOURCES] }
        },
        status: {
            type: DataTypes.STRING,
            defaultValue: 'NEW',
            validate: { isIn: [LEAD_STATUSES] }
        },
        priority: {
            type: DataTypes.STRING,
            defaultValue: 'Medium',
            validate: { isIn: [LEAD_PRIORITIES] }
        },
        budgetRange: { type: DataTypes.STRING, allowNull: true, validate: { isIn: [BUDGET_RANGES] } },
        propertyType: { type: DataTypes.STRING, allowNull: true, validate: { isIn: [PROPERTY_TYPES] } },
        preferredLocation: { type: DataTypes.STRING, allowNull: true },
        purpose: { type: DataTypes.STRING, allowNull: true },
        interestedProjectId: { type: DataTypes.UUID, allowNull: true },
        interestedUnitId: { type: DataTypes.UUID, allowNull: true },
        assignedTo: {
            type: DataTypes.UUID,
            allowNull: true,
            references: { model: 'users', key: 'id' }
        },
        assignedBy: {
            type: DataTypes.UUID,
            allowNull: true,
            references: { model: 'users', key: 'id' }
        },
        assignedAt: { type: DataTypes.DATE, allowNull: true },
        nextFollowUpDate: { type: DataTypes.DATE, allowNull: true },
        lastContactedAt: { type: DataTypes.DATE, allowNull: true },
        enquiryId: { type: DataTypes.UUID, allowNull: true },
        lostReason: { type: DataTypes.STRING, allowNull: true },
        duplicateOfLeadId: {
            type: DataTypes.UUID,
            allowNull: true,
            references: { model: 'leads', key: 'id' }
        },
        activityLog: {
            type: DataTypes.JSONB,
            defaultValue: []
        },
        reassignmentHistory: {
            type: DataTypes.JSONB,
            defaultValue: []
        },
        notes: { type: DataTypes.TEXT, allowNull: true },
        createdBy: {
            type: DataTypes.UUID,
            allowNull: false,
            references: { model: 'users', key: 'id' }
        },
    },
    {
        sequelize,
        tableName: 'leads',
        timestamps: true,
        indexes: [
            { fields: ['status'] },
            { fields: ['assignedTo'] },
            { fields: ['source'] },
            { fields: ['priority'] },
            { fields: ['phone'] },
            { fields: ['nextFollowUpDate'] },
            { fields: ['tenantId'] },
        ]
    }
);

Lead.belongsTo(User, { foreignKey: 'assignedTo', as: 'assignedUser' });
Lead.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });
Lead.belongsTo(Tenant, { foreignKey: 'tenantId', as: 'tenant' });

export default Lead;