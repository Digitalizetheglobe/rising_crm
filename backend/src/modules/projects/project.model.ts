import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../../config/sequelize';
import { PROJECT_STATUSES, PROJECT_TYPES, ProjectStatus, ProjectType } from './project.constants';
import User from '../auth/auth.model';
import Tenant from '../tenants/tenant.model';

export interface MetaCampaignAttributes {
    id: string;
    projectId: string;
    campaignName: string;
    campaignId: string;
    adSetName: string;
    adSetId: string;
    adName: string;
    adId: string;
    formName: string;
    formId: string;
    platform: 'facebook' | 'instagram';
    defaultAssigneeId?: string;
    isActive: boolean;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface ProjectAttributes {
    id: string;
    tenantId: string;
    name: string;
    location: string;
    description?: string;
    type: ProjectType;
    amenities: string[];
    totalUnits: number;
    launchDate?: Date;
    completionDate?: Date;
    status: ProjectStatus;
    images: string[];
    brochure?: string;
    reraNumber?: string;
    createdBy: string;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface ProjectCreationAttributes extends Optional<ProjectAttributes, 'id' | 'status' | 'amenities' | 'images'> {}

class Project extends Model<ProjectAttributes, ProjectCreationAttributes> implements ProjectAttributes {
    public id!: string;
    public tenantId!: string;
    public name!: string;
    public location!: string;
    public description!: string;
    public type!: ProjectType;
    public amenities!: string[];
    public totalUnits!: number;
    public launchDate!: Date;
    public completionDate!: Date;
    public status!: ProjectStatus;
    public images!: string[];
    public brochure!: string;
    public reraNumber!: string;
    public createdBy!: string;

    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}

Project.init(
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
        location: { type: DataTypes.STRING, allowNull: false },
        description: { type: DataTypes.TEXT, allowNull: true },
        type: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: { isIn: [PROJECT_TYPES] }
        },
        amenities: {
            type: DataTypes.JSONB,
            defaultValue: []
        },
        totalUnits: { type: DataTypes.INTEGER, allowNull: false, validate: { min: 1 } },
        launchDate: { type: DataTypes.DATE, allowNull: true },
        completionDate: { type: DataTypes.DATE, allowNull: true },
        status: {
            type: DataTypes.STRING,
            defaultValue: 'UPCOMING',
            validate: { isIn: [PROJECT_STATUSES] }
        },
        images: {
            type: DataTypes.JSONB,
            defaultValue: []
        },
        brochure: { type: DataTypes.STRING, allowNull: true },
        reraNumber: { type: DataTypes.STRING, allowNull: true },
        createdBy: {
            type: DataTypes.UUID,
            allowNull: false,
            references: { model: 'users', key: 'id' }
        },
    },
    {
        sequelize,
        tableName: 'projects',
        timestamps: true,
        indexes: [
            { fields: ['tenantId'] },
            { fields: ['name'] },
            { fields: ['status'] },
            { fields: ['type'] },
            { fields: ['location'] },
        ]
    }
);

class MetaCampaign extends Model<MetaCampaignAttributes, Optional<MetaCampaignAttributes, 'id' | 'isActive'>> implements MetaCampaignAttributes {
    public id!: string;
    public projectId!: string;
    public campaignName!: string;
    public campaignId!: string;
    public adSetName!: string;
    public adSetId!: string;
    public adName!: string;
    public adId!: string;
    public formName!: string;
    public formId!: string;
    public platform!: 'facebook' | 'instagram';
    public defaultAssigneeId!: string;
    public isActive!: boolean;

    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}

MetaCampaign.init(
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        projectId: {
            type: DataTypes.UUID,
            allowNull: false,
            references: { model: 'projects', key: 'id' }
        },
        campaignName: { type: DataTypes.STRING, allowNull: false },
        campaignId: { type: DataTypes.STRING, allowNull: false },
        adSetName: { type: DataTypes.STRING, allowNull: false },
        adSetId: { type: DataTypes.STRING, allowNull: false },
        adName: { type: DataTypes.STRING, allowNull: false },
        adId: { type: DataTypes.STRING, allowNull: false },
        formName: { type: DataTypes.STRING, allowNull: false },
        formId: { type: DataTypes.STRING, allowNull: false },
        platform: { type: DataTypes.STRING, allowNull: false },
        defaultAssigneeId: { type: DataTypes.UUID, allowNull: true, references: { model: 'users', key: 'id' } },
        isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
    },
    {
        sequelize,
        tableName: 'meta_campaigns',
        timestamps: true,
        indexes: [
            { fields: ['projectId'] },
            { fields: ['adId', 'isActive'] },
            { fields: ['adId'], unique: true },
        ]
    }
);

Project.hasMany(MetaCampaign, { foreignKey: 'projectId', as: 'metaCampaigns' });
MetaCampaign.belongsTo(Project, { foreignKey: 'projectId', as: 'project' });

Project.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });
Project.belongsTo(Tenant, { foreignKey: 'tenantId', as: 'tenant' });

export default Project;
export { MetaCampaign };