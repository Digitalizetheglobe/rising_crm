import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../../config/sequelize';
import Tenant from '../tenants/tenant.model';

export interface UnmatchedMetaLeadAttributes {
  id: string;
  tenantId: string;
  leadgenId: string;
  adId: string;
  formId: string;
  pageId: string;
  rawPayload: Record<string, any>;
  status: 'pending' | 'resolved';
  resolvedAt?: Date | null;
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface UnmatchedMetaLeadCreationAttributes extends Optional<UnmatchedMetaLeadAttributes, 'id' | 'status' | 'resolvedAt' | 'notes' | 'createdAt' | 'updatedAt'> {}

class UnmatchedMetaLead extends Model<UnmatchedMetaLeadAttributes, UnmatchedMetaLeadCreationAttributes> implements UnmatchedMetaLeadAttributes {
  public id!: string;
  public tenantId!: string;
  public leadgenId!: string;
  public adId!: string;
  public formId!: string;
  public pageId!: string;
  public rawPayload!: Record<string, any>;
  public status!: 'pending' | 'resolved';
  public resolvedAt?: Date | null;
  public notes?: string;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  public readonly tenant?: Tenant;
}

UnmatchedMetaLead.init(
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
    leadgenId: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
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
    rawPayload: {
      type: DataTypes.JSONB,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('pending', 'resolved'),
      allowNull: false,
      defaultValue: 'pending',
    },
    resolvedAt: {
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
    modelName: 'UnmatchedMetaLead',
    tableName: 'UnmatchedMetaLeads',
    timestamps: true,
    indexes: [
      { fields: ['tenantId'] },
      { fields: ['status', 'createdAt'] },
      { fields: ['adId'] },
    ],
  }
);

UnmatchedMetaLead.belongsTo(Tenant, { foreignKey: 'tenantId', as: 'tenant' });

export default UnmatchedMetaLead;
