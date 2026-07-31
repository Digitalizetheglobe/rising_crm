import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../../config/sequelize';

export interface TenantAttributes {
    id: string;
    name: string;
    domain?: string;
    isActive: boolean;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface TenantCreationAttributes extends Optional<TenantAttributes, 'id' | 'domain' | 'isActive'> {}

class Tenant extends Model<TenantAttributes, TenantCreationAttributes> implements TenantAttributes {
    public id!: string;
    public name!: string;
    public domain!: string;
    public isActive!: boolean;

    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}

Tenant.init(
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        domain: {
            type: DataTypes.STRING,
            allowNull: true,
            unique: true,
        },
        isActive: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
        },
    },
    {
        sequelize,
        tableName: 'tenants',
        timestamps: true,
    }
);

export default Tenant;
