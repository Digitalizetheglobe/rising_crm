import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../../config/sequelize';
import Client from '../clients/client.model';
import User from '../auth/auth.model';
import Tenant from '../tenants/tenant.model';
import { FEEDBACK_CATEGORIES, FEEDBACK_STATUSES, FeedbackCategory, FeedbackRating, FeedbackStatus } from './feedback.constants';

export interface FeedbackAttributes {
  id: string;
  tenantId: string;
  clientId: string;
  loggedBy: string;
  rating: FeedbackRating;
  category: FeedbackCategory;
  comment?: string;
  status: FeedbackStatus;
  resolvedBy?: string | null;
  resolvedAt?: Date | null;
  resolvedNote?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface FeedbackCreationAttributes extends Optional<FeedbackAttributes, 'id' | 'status' | 'comment' | 'resolvedBy' | 'resolvedAt' | 'resolvedNote' | 'createdAt' | 'updatedAt'> {}

class Feedback extends Model<FeedbackAttributes, FeedbackCreationAttributes> implements FeedbackAttributes {
  public id!: string;
  public tenantId!: string;
  public clientId!: string;
  public loggedBy!: string;
  public rating!: FeedbackRating;
  public category!: FeedbackCategory;
  public comment?: string;
  public status!: FeedbackStatus;
  public resolvedBy?: string | null;
  public resolvedAt?: Date | null;
  public resolvedNote?: string;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // relations
  public readonly client?: Client;
  public readonly loggedByUser?: User;
  public readonly resolvedByUser?: User;
  public readonly tenant?: Tenant;
}

Feedback.init(
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
    clientId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'clients', key: 'id' },
    },
    loggedBy: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'users', key: 'id' },
    },
    rating: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: { min: 1, max: 5 },
    },
    category: {
      type: DataTypes.ENUM(...FEEDBACK_CATEGORIES),
      allowNull: false,
    },
    comment: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM(...FEEDBACK_STATUSES),
      allowNull: false,
      defaultValue: 'OPEN',
    },
    resolvedBy: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: 'users', key: 'id' },
    },
    resolvedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    resolvedNote: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'Feedback',
    tableName: 'Feedbacks',
    timestamps: true,
    indexes: [
      { fields: ['tenantId'] },
      { fields: ['clientId'] },
      { fields: ['loggedBy'] },
      { fields: ['rating'] },
      { fields: ['category'] },
      { fields: ['status'] },
    ],
  }
);

Feedback.belongsTo(Client, { foreignKey: 'clientId', as: 'client' });
Feedback.belongsTo(User, { foreignKey: 'loggedBy', as: 'loggedByUser' });
Feedback.belongsTo(User, { foreignKey: 'resolvedBy', as: 'resolvedByUser' });
Feedback.belongsTo(Tenant, { foreignKey: 'tenantId', as: 'tenant' });

export default Feedback;