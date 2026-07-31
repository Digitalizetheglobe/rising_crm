import { DataTypes, Model, Optional, Op } from 'sequelize';
import sequelize from '../../config/sequelize';
import Project from '../projects/project.model';
import User from '../auth/auth.model';
import Lead from '../leads/lead.model';
import Tenant from '../tenants/tenant.model';

export const ENQUIRY_SOURCES = ['Website', 'Advertisement', 'Referral', 'Walk-In', 'Phone', 'WhatsApp', 'Email', 'Social Media', 'META_ADS', 'Other'] as const;
export const ENQUIRY_STATUSES = ['Pending', 'Contacted', 'Qualified', 'Converted', 'Rejected'] as const;
export const BUDGET_RANGES = ['Under 25L', '25L-50L', '50L-1Cr', '1Cr-2Cr', 'Above 2Cr'] as const;
export const PROPERTY_TYPES = ['1BHK', '2BHK', '3BHK', '4+BHK', 'Villa', 'Banglow', 'Plot', 'Residential', 'Commercial', 'Apartment', 'Shop', 'Office'] as const;

export type EnquirySource = typeof ENQUIRY_SOURCES[number];
export type EnquiryStatus = typeof ENQUIRY_STATUSES[number];
export type BudgetRange = typeof BUDGET_RANGES[number];
export type PropertyType = typeof PROPERTY_TYPES[number];

export interface EnquiryAttributes {
  id: string;
  tenantId: string;
  name: string;
  phone: string;
  email?: string;
  source: EnquirySource;
  platform?: 'facebook' | 'instagram' | null;
  status: EnquiryStatus;
  message?: string;
  budgetRange?: BudgetRange | null;
  propertyType?: PropertyType | null;
  preferredLocation?: string;
  interestedProjectId?: string | null;
  assignedTo?: string | null;
  assignedBy?: string | null;
  assignedAt?: Date | null;
  isConverted: boolean;
  convertedAt?: Date | null;
  convertedBy?: string | null;
  convertedLeadId?: string | null;
  rejectedAt?: Date | null;
  rejectedBy?: string | null;
  rejectionReason?: string;
  metaLeadId?: string | null;
  metaAdId?: string | null;
  metaFormId?: string | null;
  rawMetaPayload?: Record<string, any> | null;
  createdBy: string;
  lastContactedAt?: Date | null;
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface EnquiryCreationAttributes extends Optional<EnquiryAttributes, 'id' | 'status' | 'isConverted' | 'createdAt' | 'updatedAt'> {}

class Enquiry extends Model<EnquiryAttributes, EnquiryCreationAttributes> implements EnquiryAttributes {
  public id!: string;
  public tenantId!: string;
  public name!: string;
  public phone!: string;
  public email?: string;
  public source!: EnquirySource;
  public platform?: 'facebook' | 'instagram' | null;
  public status!: EnquiryStatus;
  public message?: string;
  public budgetRange?: BudgetRange | null;
  public propertyType?: PropertyType | null;
  public preferredLocation?: string;
  public interestedProjectId?: string | null;
  public assignedTo?: string | null;
  public assignedBy?: string | null;
  public assignedAt?: Date | null;
  public isConverted!: boolean;
  public convertedAt?: Date | null;
  public convertedBy?: string | null;
  public convertedLeadId?: string | null;
  public rejectedAt?: Date | null;
  public rejectedBy?: string | null;
  public rejectionReason?: string;
  public metaLeadId?: string | null;
  public metaAdId?: string | null;
  public metaFormId?: string | null;
  public rawMetaPayload?: Record<string, any> | null;
  public createdBy!: string;
  public lastContactedAt?: Date | null;
  public notes?: string;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // relations
  public readonly interestedProject?: Project;
  public readonly assignedUser?: User;
  public readonly assignedByUser?: User;
  public readonly convertedByUser?: User;
  public readonly convertedLead?: Lead;
  public readonly rejectedByUser?: User;
  public readonly createdByUser?: User;
  public readonly tenant?: Tenant;
}

Enquiry.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    tenantId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'tenants', key: 'id' },
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    source: {
      type: DataTypes.ENUM(...ENQUIRY_SOURCES),
      allowNull: false,
    },
    platform: {
      type: DataTypes.ENUM('facebook', 'instagram'),
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM(...ENQUIRY_STATUSES),
      allowNull: false,
      defaultValue: 'Pending',
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    budgetRange: {
      type: DataTypes.ENUM(...BUDGET_RANGES),
      allowNull: true,
    },
    propertyType: {
      type: DataTypes.ENUM(...PROPERTY_TYPES),
      allowNull: true,
    },
    preferredLocation: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    interestedProjectId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: 'projects', key: 'id' },
    },
    assignedTo: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: 'users', key: 'id' },
    },
    assignedBy: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: 'users', key: 'id' },
    },
    assignedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    isConverted: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    convertedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    convertedBy: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: 'users', key: 'id' },
    },
    convertedLeadId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: 'leads', key: 'id' },
    },
    rejectedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    rejectedBy: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: 'users', key: 'id' },
    },
    rejectionReason: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    metaLeadId: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true, // sparse true? Yes, but Postgres unique constraints treat nulls as distinct
    },
    metaAdId: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    metaFormId: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    rawMetaPayload: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    createdBy: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'users', key: 'id' },
    },
    lastContactedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'Enquiry',
    tableName: 'Enquiries',
    timestamps: true,
    indexes: [
      { fields: ['tenantId'] },
      { fields: ['status'] },
      { fields: ['assignedTo'] },
      { fields: ['source'] },
      { fields: ['phone'] },
      { fields: ['isConverted'] },
      { fields: ['metaLeadId'], unique: true, where: { metaLeadId: { [Op.ne]: null } } },
    ],
  }
);

Enquiry.belongsTo(Project, { foreignKey: 'interestedProjectId', as: 'interestedProject' });
Enquiry.belongsTo(User, { foreignKey: 'assignedTo', as: 'assignedUser' });
Enquiry.belongsTo(User, { foreignKey: 'assignedBy', as: 'assignedByUser' });
Enquiry.belongsTo(User, { foreignKey: 'convertedBy', as: 'convertedByUser' });
Enquiry.belongsTo(Lead, { foreignKey: 'convertedLeadId', as: 'convertedLead' });
Enquiry.belongsTo(User, { foreignKey: 'rejectedBy', as: 'rejectedByUser' });
Enquiry.belongsTo(User, { foreignKey: 'createdBy', as: 'createdByUser' });
Enquiry.belongsTo(Tenant, { foreignKey: 'tenantId', as: 'tenant' });

export default Enquiry;