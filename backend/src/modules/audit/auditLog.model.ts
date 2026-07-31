import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../../config/sequelize';
import User from '../auth/auth.model';
import Tenant from '../tenants/tenant.model';

export interface AuditLogAttributes {
    id: string;
    userId?: string;
    tenantId: string;
    action: string;
    modelName: string;
    recordId: string;
    changes?: any;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface AuditLogCreationAttributes extends Optional<AuditLogAttributes, 'id' | 'changes'> {}

class AuditLog extends Model<AuditLogAttributes, AuditLogCreationAttributes> implements AuditLogAttributes {
    public id!: string;
    public userId!: string;
    public tenantId!: string;
    public action!: string;
    public modelName!: string;
    public recordId!: string;
    public changes!: any;

    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}

AuditLog.init(
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        userId: {
            type: DataTypes.UUID,
            allowNull: true,
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
        action: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        modelName: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        recordId: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        changes: {
            type: DataTypes.JSONB,
            allowNull: true,
        }
    },
    {
        sequelize,
        tableName: 'audit_logs',
        timestamps: true,
    }
);

AuditLog.belongsTo(User, { foreignKey: 'userId', as: 'user' });
AuditLog.belongsTo(Tenant, { foreignKey: 'tenantId', as: 'tenant' });

export default AuditLog;
