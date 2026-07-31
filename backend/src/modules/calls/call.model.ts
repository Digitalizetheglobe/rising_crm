import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../../config/sequelize';
import Client from '../clients/client.model';
import User from '../auth/auth.model';
import Tenant from '../tenants/tenant.model';
import { CALL_OUTCOMES, CALL_DIRECTIONS, CALL_PURPOSES, CallOutcome, CallDirection, CallPurpose } from './call.constants';

export interface CallAttributes {
  id: string;
  tenantId: string;
  clientId: string;
  loggedBy: string;
  callDate: Date;
  duration?: number | null;
  direction: CallDirection;
  purpose: CallPurpose;
  outcome: CallOutcome;
  notes?: string;
  nextCallDate?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CallCreationAttributes extends Optional<CallAttributes, 'id' | 'duration' | 'notes' | 'nextCallDate' | 'createdAt' | 'updatedAt'> {}

class Call extends Model<CallAttributes, CallCreationAttributes> implements CallAttributes {
  public id!: string;
  public tenantId!: string;
  public clientId!: string;
  public loggedBy!: string;
  public callDate!: Date;
  public duration?: number | null;
  public direction!: CallDirection;
  public purpose!: CallPurpose;
  public outcome!: CallOutcome;
  public notes?: string;
  public nextCallDate?: Date | null;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // relations
  public readonly client?: Client;
  public readonly loggedByUser?: User;
  public readonly tenant?: Tenant;
}

Call.init(
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
    callDate: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    duration: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    direction: {
      type: DataTypes.ENUM(...CALL_DIRECTIONS),
      allowNull: false,
    },
    purpose: {
      type: DataTypes.ENUM(...CALL_PURPOSES),
      allowNull: false,
    },
    outcome: {
      type: DataTypes.ENUM(...CALL_OUTCOMES),
      allowNull: false,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    nextCallDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'Call',
    tableName: 'Calls',
    timestamps: true,
    indexes: [
      { fields: ['tenantId'] },
      { fields: ['clientId'] },
      { fields: ['loggedBy'] },
      { fields: ['callDate'] },
      { fields: ['outcome'] },
      { fields: ['nextCallDate'] },
    ],
  }
);

Call.belongsTo(Client, { foreignKey: 'clientId', as: 'client' });
Call.belongsTo(User, { foreignKey: 'loggedBy', as: 'loggedByUser' });
Call.belongsTo(Tenant, { foreignKey: 'tenantId', as: 'tenant' });

export default Call;