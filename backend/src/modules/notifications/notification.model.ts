import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../../config/sequelize';
import User from '../auth/auth.model';
import Tenant from '../tenants/tenant.model';
import {
  NotificationType,
  NotificationRefModel,
  NOTIFICATION_TYPES,
  NOTIFICATION_REF_MODELS,
} from './notification.constants';

export interface NotificationAttributes {
  id: string;
  tenantId: string;
  UserId: string;
  title: string;
  message: string;
  type: NotificationType;
  isRead: boolean;
  refId?: string | null;
  refModel?: NotificationRefModel | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface NotificationCreationAttributes extends Optional<NotificationAttributes, 'id' | 'isRead' | 'refId' | 'refModel' | 'createdAt' | 'updatedAt'> {}

class Notification extends Model<NotificationAttributes, NotificationCreationAttributes> implements NotificationAttributes {
  public id!: string;
  public tenantId!: string;
  public UserId!: string;
  public title!: string;
  public message!: string;
  public type!: NotificationType;
  public isRead!: boolean;
  public refId?: string | null;
  public refModel?: NotificationRefModel | null;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // relations
  public readonly user?: User;
  public readonly tenant?: Tenant;
}

Notification.init(
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
    UserId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'users', key: 'id' },
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    type: {
      type: DataTypes.ENUM(...NOTIFICATION_TYPES),
      allowNull: false,
    },
    isRead: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    refId: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    refModel: {
      type: DataTypes.ENUM(...NOTIFICATION_REF_MODELS),
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'Notification',
    tableName: 'Notifications',
    timestamps: true,
    indexes: [
      { fields: ['tenantId'] },
      { fields: ['UserId', 'isRead', 'createdAt'] },
    ],
  }
);

Notification.belongsTo(User, { foreignKey: 'UserId', as: 'user' });
Notification.belongsTo(Tenant, { foreignKey: 'tenantId', as: 'tenant' });

export default Notification;