import { Op, fn, col } from 'sequelize';
import { ApiError } from '../../utils/ApiError';
// import { Unit } from '../units/unit.model'; // To be migrated
import { Project } from './project.model';
import User from '../auth/auth.model';

const buildFilterQuery = (query: Record<string, any>) => {
    const filter: Record<string, any> = {};

    if (query.tenantId) filter.tenantId = query.tenantId;
    if (query.status) filter.status = query.status;
    if (query.type)   filter.type   = query.type;

    if (query.startDate || query.endDate) {
        filter.createdAt = {};
        if (query.startDate) filter.createdAt[Op.gte] = new Date(query.startDate);
        if (query.endDate)   filter.createdAt[Op.lte] = new Date(new Date(query.endDate).setHours(23, 59, 59, 999));
    }

    if (query.search) {
        filter[Op.or] = [
            { name:     { [Op.iLike]: `%${query.search}%` } },
            { location: { [Op.iLike]: `%${query.search}%` } },
        ];
    }

    return filter;
};

export const createProjectService = async (
    payload: Record<string, any>,
    createdBy: string,
    tenantId: string
) => {
    const existing = await Project.findOne({ 
        where: { 
            name: { [Op.iLike]: payload.name },
            tenantId
        } 
    });
    if (existing) throw new ApiError(409, 'A project with this name already exists');

    const project = await Project.create({
        ...payload,
        tenantId,
        amenities: payload.amenities ?? [],
        images:    payload.images    ?? [],
        createdBy: createdBy,
    } as any);

    return Project.findByPk(project.id, {
        include: [{ model: User, as: 'creator', attributes: ['id', 'name', 'email'] }]
    });
};

export const getAllProjectsService = async (
    query: Record<string, any>,
    page: number = 1,
    limit: number = 10,
    tenantId: string
) => {
    query.tenantId = tenantId;
    const filter = buildFilterQuery(query);
    const offset = (page - 1) * limit;

    const { rows: projects, count: total } = await Project.findAndCountAll({
        where: filter,
        include: [{ model: User, as: 'creator', attributes: ['id', 'name', 'email'] }],
        order: [['createdAt', 'DESC']],
        limit,
        offset,
    });

    return {
        projects,
        total,
        page,
        totalPages:  Math.ceil(total / limit),
        hasNextPage: page < Math.ceil(total / limit),
        hasPrevPage: page > 1,
    };
};

export const getProjectByIdService = async (projectId: string, tenantId: string) => {
    const project = await Project.findOne({
        where: { id: projectId, tenantId },
        include: [{ model: User, as: 'creator', attributes: ['id', 'name', 'email'] }]
    });

    if (!project) throw new ApiError(404, 'Project not found');
    return project;
};

export const updateProjectService = async (
    projectId: string,
    payload: Record<string, any>,
    tenantId: string
) => {
    const project = await Project.findOne({ where: { id: projectId, tenantId } });
    if (!project) throw new ApiError(404, 'Project not found');

    if (project.status === 'COMPLETED' && payload.status && payload.status !== 'COMPLETED') {
        throw new ApiError(400, 'Cannot revert a completed project to another status');
    }

    delete payload.createdBy;

    Object.assign(project, payload);
    await project.save();

    return Project.findByPk(project.id, {
        include: [{ model: User, as: 'creator', attributes: ['id', 'name', 'email'] }]
    });
};

export const deleteProjectService = async (projectId: string, tenantId: string) => {
    const project = await Project.findOne({ where: { id: projectId, tenantId } });
    if (!project) throw new ApiError(404, 'Project not found');

    // Block deletion if units exist under this project
    // const unitCount = await Unit.count({ where: { projectId } });
    const unitCount = 0; // TODO: restore once Unit is migrated
    if (unitCount > 0) {
        throw new ApiError(400, `Cannot delete project — it has ${unitCount} unit(s) linked to it`);
    }

    await project.destroy();
    return { message: 'Project deleted successfully' };
};

export const getProjectUnitsService = async (projectId: string, tenantId: string) => {
    await getProjectByIdService(projectId, tenantId);

    // const units = await Unit.findAll({ where: { projectId }, order: [['unitNumber', 'ASC']] });
    const units: any[] = []; // TODO: restore once Unit is migrated

    return units;
};

export const getProjectStatsService = async (projectId: string, tenantId: string) => {
    const project = await getProjectByIdService(projectId, tenantId);

    // TODO: restore once Unit is migrated
    /*
    const unitStats = await Unit.findAll({
        attributes: [
            [fn('COUNT', col('id')), 'total'],
            [fn('SUM', sequelize.literal("CASE WHEN status = 'Available' THEN 1 ELSE 0 END")), 'available'],
            [fn('SUM', sequelize.literal("CASE WHEN status = 'Booked' THEN 1 ELSE 0 END")), 'booked'],
            [fn('SUM', sequelize.literal("CASE WHEN status = 'Sold' THEN 1 ELSE 0 END")), 'sold'],
            [fn('MIN', col('price')), 'minPrice'],
            [fn('MAX', col('price')), 'maxPrice']
        ],
        where: { projectId }
    });
    const stats = unitStats[0]?.dataValues || { total: 0, available: 0, booked: 0, sold: 0, minPrice: 0, maxPrice: 0 };
    */
    const stats = { total: 0, available: 0, booked: 0, sold: 0, minPrice: 0, maxPrice: 0 };

    return {
        project,
        units: {
            total:     stats.total,
            available: stats.available,
            booked:    stats.booked,
            sold:      stats.sold,
            occupancy: stats.total > 0
                ? (((stats.booked + stats.sold) / stats.total) * 100).toFixed(1) + '%'
                : '0%',
            priceRange: {
                min: stats.minPrice,
                max: stats.maxPrice,
            },
        },
    };
};

export const updateProjectImagesService = async (
    projectId: string,
    images: string[],
    tenantId: string,
    brochure?: string
) => {
    const project = await Project.findOne({ where: { id: projectId, tenantId } });
    if (!project) throw new ApiError(404, 'Project not found');

    if (images.length > 0) {
        project.images = [...(project.images || []), ...images];
        project.changed('images', true);
    }
    if (brochure) project.brochure = brochure;

    await project.save();
    return project;
};
