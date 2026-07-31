import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../../config/sequelize';

export interface PermissionAttributes {
    id: string;
    module: string; // e.g., 'leads', 'projects', 'users'
    action: string; // e.g., 'create', 'read', 'update', 'delete'
    description?: string;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface PermissionCreationAttributes extends Optional<PermissionAttributes, 'id' | 'description'> {}

class Permission extends Model<PermissionAttributes, PermissionCreationAttributes> implements PermissionAttributes {
    public id!: string;
    public module!: string;
    public action!: string;
    public description!: string;

    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}

Permission.init(
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        module: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        action: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        description: {
            type: DataTypes.STRING,
            allowNull: true,
        },
    },
    {
        sequelize,
        tableName: 'permissions',
        timestamps: true,
        indexes: [
            {
                unique: true,
                fields: ['module', 'action']
            }
        ]
    }
);

export default Permission;
