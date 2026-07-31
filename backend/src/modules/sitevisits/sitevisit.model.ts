import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../../config/sequelize';
import Lead from '../leads/lead.model';
import Project from '../projects/project.model';
import User from '../auth/auth.model';
import Tenant from '../tenants/tenant.model';

export const SITE_VISIT_STATUSES = ['SCHEDULED', 'PENDING', 'COMPLETED', 'CANCELLED'] as const;
export type SiteVisitStatus = typeof SITE_VISIT_STATUSES[number];

export interface SiteVisitAttributes {
  id: string;
  tenantId: string;
  leadId: string;
  projectId?: string | null;
  assignedTo: string;
  createdBy: string;
  status: SiteVisitStatus;
  scheduledAt: Date;
  completedAt?: Date | null;
  notes?: string;
  outcome?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface SiteVisitCreationAttributes extends Optional<SiteVisitAttributes, 'id' | 'projectId' | 'status' | 'completedAt' | 'notes' | 'outcome' | 'createdAt' | 'updatedAt'> {}

class SiteVisit extends Model<SiteVisitAttributes, SiteVisitCreationAttributes> implements SiteVisitAttributes {
  public id!: string;
  public tenantId!: string;
  public leadId!: string;
  public projectId?: string | null;
  public assignedTo!: string;
  public createdBy!: string;
  public status!: SiteVisitStatus;
  public scheduledAt!: Date;
  public completedAt?: Date | null;
  public notes?: string;
  public outcome?: string;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // relations
  public readonly lead?: Lead;
  public readonly project?: Project;
  public readonly assignedUser?: User;
  public readonly createdByUser?: User;
  public readonly tenant?: Tenant;
}

SiteVisit.init(
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
    projectId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: 'projects', key: 'id' },
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
    status: {
      type: DataTypes.ENUM(...SITE_VISIT_STATUSES),
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
  },
  {
    sequelize,
    modelName: 'SiteVisit',
    tableName: 'SiteVisits',
    timestamps: true,
    indexes: [
      { fields: ['tenantId'] },
      { fields: ['leadId'] },
      { fields: ['assignedTo'] },
      { fields: ['status'] },
      { fields: ['scheduledAt'] },
    ],
  }
);

SiteVisit.belongsTo(Lead, { foreignKey: 'leadId', as: 'lead' });
SiteVisit.belongsTo(Project, { foreignKey: 'projectId', as: 'project' });
SiteVisit.belongsTo(User, { foreignKey: 'assignedTo', as: 'assignedUser' });
SiteVisit.belongsTo(User, { foreignKey: 'createdBy', as: 'createdByUser' });
SiteVisit.belongsTo(Tenant, { foreignKey: 'tenantId', as: 'tenant' });

export default SiteVisit;
