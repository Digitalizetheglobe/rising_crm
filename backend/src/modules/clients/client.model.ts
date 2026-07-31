import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../../config/sequelize';
import { CLIENT_STATUSES, ClientStatus } from './client.constants';
import User from '../auth/auth.model';
import Tenant from '../tenants/tenant.model';
import Lead from '../leads/lead.model';

export interface ClientAttributes {
    id: string;
    tenantId: string;
    name: string;
    phone: string;
    email?: string;
    alternatePhone?: string;
    address?: any;
    dateOfBirth?: Date;
    aadhaarNumber?: string;
    panNumber?: string;
    aadhaarDocument?: string;
    panDocument?: string;
    kycVerified: boolean;
    sourceLeadId?: string;
    assignedTo?: string;
    createdBy: string;
    status: ClientStatus;
    notes?: string;
    activityLog: any[];
    createdAt?: Date;
    updatedAt?: Date;
}

export interface ClientCreationAttributes extends Optional<ClientAttributes, 'id' | 'kycVerified' | 'status' | 'activityLog'> {}

class Client extends Model<ClientAttributes, ClientCreationAttributes> implements ClientAttributes {
    public id!: string;
    public tenantId!: string;
    public name!: string;
    public phone!: string;
    public email!: string;
    public alternatePhone!: string;
    public address!: any;
    public dateOfBirth!: Date;
    public aadhaarNumber!: string;
    public panNumber!: string;
    public aadhaarDocument!: string;
    public panDocument!: string;
    public kycVerified!: boolean;
    public sourceLeadId!: string;
    public assignedTo!: string;
    public createdBy!: string;
    public status!: ClientStatus;
    public notes!: string;
    public activityLog!: any[];

    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}

Client.init(
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        tenantId: {
            type: DataTypes.UUID,
            allowNull: false,
            references: { model: 'tenants', key: 'id' }
        },
        name: { type: DataTypes.STRING, allowNull: false },
        phone: { type: DataTypes.STRING, allowNull: false, unique: true },
        email: { type: DataTypes.STRING, allowNull: true },
        alternatePhone: { type: DataTypes.STRING, allowNull: true },
        address: { type: DataTypes.JSONB, allowNull: true },
        dateOfBirth: { type: DataTypes.DATE, allowNull: true },
        aadhaarNumber: { type: DataTypes.STRING, allowNull: true },
        panNumber: { type: DataTypes.STRING, allowNull: true },
        aadhaarDocument: { type: DataTypes.STRING, allowNull: true },
        panDocument: { type: DataTypes.STRING, allowNull: true },
        kycVerified: { type: DataTypes.BOOLEAN, defaultValue: false },
        sourceLeadId: {
            type: DataTypes.UUID,
            allowNull: true,
            references: { model: 'leads', key: 'id' }
        },
        assignedTo: {
            type: DataTypes.UUID,
            allowNull: true,
            references: { model: 'users', key: 'id' }
        },
        createdBy: {
            type: DataTypes.UUID,
            allowNull: false,
            references: { model: 'users', key: 'id' }
        },
        status: {
            type: DataTypes.STRING,
            defaultValue: 'ACTIVE',
            validate: { isIn: [CLIENT_STATUSES] }
        },
        notes: { type: DataTypes.TEXT, allowNull: true },
        activityLog: { type: DataTypes.JSONB, defaultValue: [] },
    },
    {
        sequelize,
        tableName: 'clients',
        timestamps: true,
        indexes: [
            { fields: ['tenantId'] },
            { fields: ['sourceLeadId'] },
            { fields: ['assignedTo'] },
            { fields: ['status'] },
            { fields: ['kycVerified'] },
        ]
    }
);

Client.belongsTo(Lead, { foreignKey: 'sourceLeadId', as: 'sourceLead' });
Client.belongsTo(User, { foreignKey: 'assignedTo', as: 'assignedUser' });
Client.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });
Client.belongsTo(Tenant, { foreignKey: 'tenantId', as: 'tenant' });

export default Client;
