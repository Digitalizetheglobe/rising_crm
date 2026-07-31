import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../../config/sequelize';
import Enquiry from '../enquiries/enquiry.model';
import Tenant from '../tenants/tenant.model';
import { MetaPlatform } from './metaWebhook.constants';

export interface MetaWebhookEventAttributes {
  id: string;
  tenantId: string;
  eventId: string;
  leadgenId: string;
  adId: string;
  formId: string;
  pageId: string;
  platform?: MetaPlatform | null;
  rawPayload: Record<string, any>;
  processedAt: Date;
  status: 'success' | 'failed' | 'unmatched';
  enquiryId?: string | null;
  errorMessage?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface MetaWebhookEventCreationAttributes extends Optional<MetaWebhookEventAttributes, 'id' | 'processedAt' | 'platform' | 'enquiryId' | 'errorMessage' | 'createdAt' | 'updatedAt'> {}

class MetaWebhookEvent extends Model<MetaWebhookEventAttributes, MetaWebhookEventCreationAttributes> implements MetaWebhookEventAttributes {
  public id!: string;
  public tenantId!: string;
  public eventId!: string;
  public leadgenId!: string;
  public adId!: string;
  public formId!: string;
  public pageId!: string;
  public platform?: MetaPlatform | null;
  public rawPayload!: Record<string, any>;
  public processedAt!: Date;
  public status!: 'success' | 'failed' | 'unmatched';
  public enquiryId?: string | null;
  public errorMessage?: string;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // relations
  public readonly enquiry?: Enquiry;
  public readonly tenant?: Tenant;
}

MetaWebhookEvent.init(
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
    eventId: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    leadgenId: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    adId: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    formId: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    pageId: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    platform: {
      type: DataTypes.ENUM('facebook', 'instagram'),
      allowNull: true,
    },
    rawPayload: {
      type: DataTypes.JSONB,
      allowNull: false,
    },
    processedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    status: {
      type: DataTypes.ENUM('success', 'failed', 'unmatched'),
      allowNull: false,
    },
    enquiryId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: 'Enquiries', key: 'id' },
    },
    errorMessage: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'MetaWebhookEvent',
    tableName: 'MetaWebhookEvents',
    timestamps: true,
    indexes: [
      { fields: ['tenantId'] },
      { fields: ['leadgenId'] },
      { fields: ['adId'] },
      { fields: ['status', 'createdAt'] },
      { fields: ['enquiryId'] },
    ],
  }
);

MetaWebhookEvent.belongsTo(Enquiry, { foreignKey: 'enquiryId', as: 'enquiry' });
MetaWebhookEvent.belongsTo(Tenant, { foreignKey: 'tenantId', as: 'tenant' });

export default MetaWebhookEvent;
