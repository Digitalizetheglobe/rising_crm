import mongoose from 'mongoose';
import { ApiError } from '../../utils/ApiError';
import { Unit } from '../units/unit.model';
import { Project } from './project.model';

const buildFilterQuery = (query: Record<string, any>) => {
    const filter: Record<string, any> = {};

    if (query.status) filter.status = query.status;
    if (query.type)   filter.type   = query.type;

    if (query.startDate || query.endDate) {
        filter.createdAt = {};
        if (query.startDate) filter.createdAt.$gte = new Date(query.startDate);
        if (query.endDate)   filter.createdAt.$lte = new Date(new Date(query.endDate).setHours(23, 59, 59, 999));
    }

    if (query.search) {
        filter.$or = [
            { name:     { $regex: query.search, $options: 'i' } },
            { location: { $regex: query.search, $options: 'i' } },
        ];
    }

    return filter;
};

export const createProjectService = async (
    payload: Record<string, any>,
    createdBy: string
) => {
    const existing = await Project.findOne({ name: { $regex: new RegExp(`^${payload.name}$`, 'i') } });
    if (existing) throw new ApiError(409, 'A project with this name already exists');

    const project = await Project.create({
        ...payload,
        amenities: payload.amenities ?? [],
        images:    payload.images    ?? [],
        createdBy: new mongoose.Types.ObjectId(createdBy),
    });

    return Project.findById(project._id).populate('createdBy', 'name email');
};

export const getAllProjectsService = async (
    query: Record<string, any>,
    page: number = 1,
    limit: number = 10
) => {
    const filter = buildFilterQuery(query);
    const skip   = (page - 1) * limit;

    const [projects, total] = await Promise.all([
        Project.find(filter)
            .populate('createdBy', 'name email')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit),
        Project.countDocuments(filter),
    ]);

    return {
        projects,
        total,
        page,
        totalPages:  Math.ceil(total / limit),
        hasNextPage: page < Math.ceil(total / limit),
        hasPrevPage: page > 1,
    };
};

export const getProjectByIdService = async (projectId: string) => {
    const project = await Project.findById(projectId)
        .populate('createdBy', 'name email');

    if (!project) throw new ApiError(404, 'Project not found');
    return project;
};

export const updateProjectService = async (
    projectId: string,
    payload: Record<string, any>
) => {
    const project = await Project.findById(projectId);
    if (!project) throw new ApiError(404, 'Project not found');

    if (project.status === 'COMPLETED' && payload.status && payload.status !== 'COMPLETED') {
        throw new ApiError(400, 'Cannot revert a completed project to another status');
    }

    // Prevent createdBy from being overwritten
    delete payload.createdBy;

    Object.assign(project, payload);
    await project.save();

    return Project.findById(project._id).populate('createdBy', 'name email');
};

export const deleteProjectService = async (projectId: string) => {
    const project = await Project.findById(projectId);
    if (!project) throw new ApiError(404, 'Project not found');

    // Block deletion if units exist under this project
    const unitCount = await Unit.countDocuments({ project: new mongoose.Types.ObjectId(projectId) });
    if (unitCount > 0) {
        throw new ApiError(400, `Cannot delete project — it has ${unitCount} unit(s) linked to it`);
    }

    await Project.findByIdAndDelete(projectId);
    return { message: 'Project deleted successfully' };
};

export const getProjectUnitsService = async (projectId: string) => {
    await getProjectByIdService(projectId);

    const units = await Unit.find({ project: new mongoose.Types.ObjectId(projectId) })
        .sort({ unitNumber: 1 });

    return units;
};

export const getProjectStatsService = async (projectId: string) => {
    await getProjectByIdService(projectId);

    const pid = new mongoose.Types.ObjectId(projectId);

    const [unitStats, project] = await Promise.all([
        Unit.aggregate([
            { $match: { project: pid } },
            {
                $group: {
                    _id:       null,
                    total:     { $sum: 1 },
                    available: { $sum: { $cond: [{ $eq: ['$status', 'Available'] }, 1, 0] } },
                    booked:    { $sum: { $cond: [{ $eq: ['$status', 'Booked']    }, 1, 0] } },
                    sold:      { $sum: { $cond: [{ $eq: ['$status', 'Sold']      }, 1, 0] } },
                    minPrice:  { $min: '$price' },
                    maxPrice:  { $max: '$price' },
                },
            },
        ]),
        Project.findById(projectId),
    ]);

    const stats = unitStats[0] || { total: 0, available: 0, booked: 0, sold: 0, minPrice: 0, maxPrice: 0 };

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
    brochure?: string
) => {
    const project = await Project.findById(projectId);
    if (!project) throw new ApiError(404, 'Project not found');

    if (images.length > 0) project.images = [...project.images, ...images];
    if (brochure) project.brochure = brochure;

    await project.save();
    return project;
};
