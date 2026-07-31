import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../../config/sequelize';
import User from './auth.model';
import Tenant from '../tenants/tenant.model';

export interface SessionAttributes {
    id: string;
    userId: string;
    tenantId: string;
    refreshToken: string;
    expiresAt: Date;
    userAgent?: string;
    ipAddress?: string;
    isActive: boolean;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface SessionCreationAttributes extends Optional<SessionAttributes, 'id' | 'isActive' | 'userAgent' | 'ipAddress'> {}

class Session extends Model<SessionAttributes, SessionCreationAttributes> implements SessionAttributes {
    public id!: string;
    public userId!: string;
    public tenantId!: string;
    public refreshToken!: string;
    public expiresAt!: Date;
    public userAgent!: string;
    public ipAddress!: string;
    public isActive!: boolean;

    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}

Session.init(
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        userId: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'users',
                key: 'id'
            }
        },
        tenantId: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'tenants',
                key: 'id'
            }
        },
        refreshToken: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        expiresAt: {
            type: DataTypes.DATE,
            allowNull: false,
        },
        userAgent: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        ipAddress: {
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
        tableName: 'sessions',
        timestamps: true,
    }
);

Session.belongsTo(User, { foreignKey: 'userId', as: 'user' });
Session.belongsTo(Tenant, { foreignKey: 'tenantId', as: 'tenant' });

export default Session;
