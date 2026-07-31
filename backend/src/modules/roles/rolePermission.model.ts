import { DataTypes, Model } from 'sequelize';
import sequelize from '../../config/sequelize';
import Role from './role.model';
import Permission from './permission.model';

class RolePermission extends Model {
    public roleId!: string;
    public permissionId!: string;
}

RolePermission.init(
    {
        roleId: {
            type: DataTypes.UUID,
            references: {
                model: 'roles',
                key: 'id'
            },
            primaryKey: true,
        },
        permissionId: {
            type: DataTypes.UUID,
            references: {
                model: 'permissions',
                key: 'id'
            },
            primaryKey: true,
        }
    },
    {
        sequelize,
        tableName: 'role_permissions',
        timestamps: false,
    }
);

Role.belongsToMany(Permission, { through: RolePermission, foreignKey: 'roleId', as: 'permissions' });
Permission.belongsToMany(Role, { through: RolePermission, foreignKey: 'permissionId', as: 'roles' });

export default RolePermission;
