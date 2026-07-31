import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../../config/sequelize';
import Lead from '../leads/lead.model';
import User from '../auth/auth.model';
import Tenant from '../tenants/tenant.model';

export const FOLLOWUP_TYPES = ['Call', 'Email', 'WhatsApp', 'Site Visit', 'Meeting', 'Other'] as const;
export const FOLLOWUP_STATUSES = ['SCHEDULED', 'PENDING', 'COMPLETED', 'RESCHEDULED', 'MISSED', 'CANCELLED'] as const;

export type FollowUpType = typeof FOLLOWUP_TYPES[number];
export type FollowUpStatus = typeof FOLLOWUP_STATUSES[number];

export interface FollowUpAttributes {
  id: string;
  tenantId: string;
  leadId: string;
  assignedTo: string;
  createdBy: string;
  type: FollowUpType;
  status: FollowUpStatus;
  scheduledAt: Date;
  completedAt?: Date | null;
  notes?: string;
  outcome?: string;
  rescheduledFrom?: string | null;
  rescheduledAt?: Date | null;
  rescheduleReason?: string | null;
  reminderSent: boolean;
  reminderSentAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface FollowUpCreationAttributes extends Optional<FollowUpAttributes, 'id' | 'status' | 'completedAt' | 'notes' | 'outcome' | 'rescheduledFrom' | 'rescheduledAt' | 'rescheduleReason' | 'reminderSent' | 'reminderSentAt' | 'createdAt' | 'updatedAt'> {}

class FollowUp extends Model<FollowUpAttributes, FollowUpCreationAttributes> implements FollowUpAttributes {
  public id!: string;
  public tenantId!: string;
  public leadId!: string;
  public assignedTo!: string;
  public createdBy!: string;
  public type!: FollowUpType;
  public status!: FollowUpStatus;
  public scheduledAt!: Date;
  public completedAt?: Date | null;
  public notes?: string;
  public outcome?: string;
  public rescheduledFrom?: string | null;
  public rescheduledAt?: Date | null;
  public rescheduleReason?: string | null;
  public reminderSent!: boolean;
  public reminderSentAt?: Date | null;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // relations
  public readonly lead?: Lead;
  public readonly assignedUser?: User;
  public readonly createdByUser?: User;
  public readonly previousFollowUp?: FollowUp;
  public readonly tenant?: Tenant;
}

FollowUp.init(
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
    leadId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'leads', key: 'id' },
    },
    assignedTo: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'users', key: 'id' },
    },
    createdBy: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'users', key: 'id' },
    },
    type: {
      type: DataTypes.ENUM(...FOLLOWUP_TYPES),
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM(...FOLLOWUP_STATUSES),
      allowNull: false,
      defaultValue: 'SCHEDULED',
    },
    scheduledAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    completedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    outcome: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    rescheduledFrom: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: 'FollowUps', key: 'id' },
    },
    rescheduledAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    rescheduleReason: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    reminderSent: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    reminderSentAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'FollowUp',
    tableName: 'FollowUps',
    timestamps: true,
    indexes: [
      { fields: ['tenantId'] },
      { fields: ['leadId'] },
      { fields: ['assignedTo'] },
      { fields: ['status'] },
      { fields: ['scheduledAt'] },
      { fields: ['assignedTo', 'status'] },
      { fields: ['scheduledAt', 'status', 'reminderSent'] },
    ],
  }
);

FollowUp.belongsTo(Lead, { foreignKey: 'leadId', as: 'lead' });
FollowUp.belongsTo(User, { foreignKey: 'assignedTo', as: 'assignedUser' });
FollowUp.belongsTo(User, { foreignKey: 'createdBy', as: 'createdByUser' });
FollowUp.belongsTo(FollowUp, { foreignKey: 'rescheduledFrom', as: 'previousFollowUp' });
FollowUp.belongsTo(Tenant, { foreignKey: 'tenantId', as: 'tenant' });

export default FollowUp;