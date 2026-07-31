import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../../config/sequelize';
import Tenant from '../tenants/tenant.model';

export interface RoleAttributes {
    id: string;
    tenantId: string;
    name: string;
    description?: string;
    isActive: boolean;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface RoleCreationAttributes extends Optional<RoleAttributes, 'id' | 'isActive' | 'description'> {}

class Role extends Model<RoleAttributes, RoleCreationAttributes> implements RoleAttributes {
    public id!: string;
    public tenantId!: string;
    public name!: string;
    public description!: string;
    public isActive!: boolean;

    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}

Role.init(
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
        name: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        description: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        isActive: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
        },
    },
    {
        sequelize,
        tableName: 'roles',
        timestamps: true,
    }
);

Role.belongsTo(Tenant, { foreignKey: 'tenantId', as: 'tenant' });
Tenant.hasMany(Role, { foreignKey: 'tenantId', as: 'roles' });

export default Role;
