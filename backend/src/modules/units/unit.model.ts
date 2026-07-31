import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../../config/sequelize';
import Project from '../projects/project.model';
import { UNIT_TYPES, UNIT_STATUSES, UNIT_FACINGS, UnitType, UnitStatus, UnitFacing } from './unit.constants';
import Tenant from '../tenants/tenant.model';

export interface UnitAttributes {
  id: string;
  tenantId: string;
  projectId: string;
  unitNumber: string;
  type: UnitType;
  floor: number;
  area: number;
  price: number;
  status: UnitStatus;
  facing?: UnitFacing | null;
  description?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface UnitCreationAttributes extends Optional<UnitAttributes, 'id' | 'status' | 'facing' | 'description' | 'createdAt' | 'updatedAt'> {}

class Unit extends Model<UnitAttributes, UnitCreationAttributes> implements UnitAttributes {
  public id!: string;
  public tenantId!: string;
  public projectId!: string;
  public unitNumber!: string;
  public type!: UnitType;
  public floor!: number;
  public area!: number;
  public price!: number;
  public status!: UnitStatus;
  public facing?: UnitFacing | null;
  public description?: string;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // relations
  public readonly project?: Project;
  public readonly tenant?: Tenant;
}

Unit.init(
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
        key: 'id',
      },
    },
    projectId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'projects',
        key: 'id',
      },
    },
    unitNumber: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    type: {
      type: DataTypes.ENUM(...UNIT_TYPES),
      allowNull: false,
    },
    floor: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 0,
      },
    },
    area: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
      },
    },
    price: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      get() {
        const val = this.getDataValue('price');
        return val === null ? null : parseFloat(val as any);
      },
      validate: {
        min: 0,
      },
    },
    status: {
      type: DataTypes.ENUM(...UNIT_STATUSES),
      allowNull: false,
      defaultValue: 'Available',
    },
    facing: {
      type: DataTypes.ENUM(...UNIT_FACINGS),
      allowNull: true,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'Unit',
    tableName: 'Units',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['projectId', 'unitNumber'],
      },
      { fields: ['tenantId'] },
      { fields: ['projectId', 'status'] },
      { fields: ['projectId', 'type'] },
      { fields: ['projectId', 'floor'] },
    ],
  }
);

setTimeout(() => {
  Unit.belongsTo(Project, { foreignKey: 'projectId', as: 'project' });
  Unit.belongsTo(Tenant, { foreignKey: 'tenantId', as: 'tenant' });
}, 0);

export default Unit;