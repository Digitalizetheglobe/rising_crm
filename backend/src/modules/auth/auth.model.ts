import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../../config/sequelize';
import bcrypt from 'bcryptjs';
import Tenant from '../tenants/tenant.model';
import Role from '../roles/role.model';

export interface UserAttributes {
    id: string;
    tenantId: string;
    roleId?: string; // Optional if we still use legacy role string during transition, but ultimately it's FK
    name: string;
    email: string;
    password?: string;
    phone: string;
    role: string; // Legacy role string, kept for backwards compatibility during migration
    isActive: boolean;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface UserCreationAttributes extends Optional<UserAttributes, 'id' | 'role' | 'isActive' | 'roleId'> {}

class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
    public id!: string;
    public tenantId!: string;
    public roleId!: string;
    public name!: string;
    public email!: string;
    public password!: string;
    public phone!: string;
    public role!: string;
    public isActive!: boolean;

    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;

    public async comparePassword(candidatePassword: string): Promise<boolean> {
        return bcrypt.compare(candidatePassword, this.password);
    }
}

User.init(
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
        roleId: {
            type: DataTypes.UUID,
            allowNull: true,
            references: {
                model: 'roles',
                key: 'id'
            }
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        email: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
        },
        password: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        phone: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
        },
        role: {
            type: DataTypes.STRING,
            defaultValue: 'Sales Executive',
        },
        isActive: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
        },
    },
    {
        sequelize,
        tableName: 'users',
        timestamps: true,
        hooks: {
            beforeSave: async (user: User) => {
                if (user.changed('password')) {
                    user.password = await bcrypt.hash(user.password, 10);
                }
            }
        }
    }
);

User.belongsTo(Tenant, { foreignKey: 'tenantId', as: 'tenant' });
Tenant.hasMany(User, { foreignKey: 'tenantId', as: 'users' });

User.belongsTo(Role, { foreignKey: 'roleId', as: 'roleData' });
Role.hasMany(User, { foreignKey: 'roleId', as: 'users' });

export default User;
