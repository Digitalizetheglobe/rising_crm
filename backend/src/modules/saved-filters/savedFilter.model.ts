import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../../config/sequelize';
import Tenant from '../tenants/tenant.model';
import User from '../auth/auth.model';

export interface SavedFilterAttributes {
    id: string;
    tenantId: string;
    userId: string;
    gridId: string;
    filterState: any;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface SavedFilterCreationAttributes extends Optional<SavedFilterAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

class SavedFilter extends Model<SavedFilterAttributes, SavedFilterCreationAttributes> implements SavedFilterAttributes {
    public id!: string;
    public tenantId!: string;
    public userId!: string;
    public gridId!: string;
    public filterState!: any;

    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}

SavedFilter.init(
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
        userId: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'users',
                key: 'id'
            }
        },
        gridId: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        filterState: {
            type: DataTypes.JSONB,
            allowNull: false,
        },
    },
    {
        sequelize,
        tableName: 'saved_filters',
        timestamps: true,
        indexes: [
            { fields: ['tenantId'] },
            { fields: ['userId', 'gridId'], unique: true },
        ]
    }
);

SavedFilter.belongsTo(Tenant, { foreignKey: 'tenantId', as: 'tenant' });
SavedFilter.belongsTo(User, { foreignKey: 'userId', as: 'user' });

export default SavedFilter;
