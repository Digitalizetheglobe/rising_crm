import mongoose from 'mongoose';
import { ApiError } from '../../utils/ApiError';
import { Client } from '../clients/client.model';
import { Feedback } from './feedback.model';

const buildFilterQuery = (query: Record<string, any>) => {
    const filter: Record<string, any> = {};

    if (query.client)   filter.client   = new mongoose.Types.ObjectId(query.client);
    if (query.loggedBy) filter.loggedBy = new mongoose.Types.ObjectId(query.loggedBy);
    if (query.category) filter.category = query.category;
    if (query.status)   filter.status   = query.status;
    if (query.rating)   filter.rating   = Number(query.rating);

    if (query.startDate || query.endDate) {
        filter.createdAt = {};
        if (query.startDate) filter.createdAt.$gte = new Date(query.startDate);
        if (query.endDate)   filter.createdAt.$lte = new Date(new Date(query.endDate).setHours(23, 59, 59, 999));
    }

    return filter;
};

export const createFeedbackService = async (
    payload: Record<string, any>,
    loggedBy: string
) => {
    const client = await Client.findById(payload.client);
    if (!client) throw new ApiError(404, 'Client not found');

    const feedback = await Feedback.create({
        ...payload,
        client:   new mongoose.Types.ObjectId(payload.client),
        loggedBy: new mongoose.Types.ObjectId(loggedBy),
        status:   'OPEN',
    });

    return Feedback.findById(feedback._id)
        .populate('client',   'name phone email')
        .populate('loggedBy', 'name email');
};

export const getAllFeedbacksService = async (
    query: Record<string, any>,
    page: number = 1,
    limit: number = 10
) => {
    const filter = buildFilterQuery(query);
    const skip   = (page - 1) * limit;

    const [feedbacks, total] = await Promise.all([
        Feedback.find(filter)
            .populate('client',     'name phone email')
            .populate('loggedBy',   'name email')
            .populate('resolvedBy', 'name email')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit),
        Feedback.countDocuments(filter),
    ]);

    return {
        feedbacks,
        total,
        page,
        totalPages:  Math.ceil(total / limit),
        hasNextPage: page < Math.ceil(total / limit),
        hasPrevPage: page > 1,
    };
};

export const getFeedbackByIdService = async (feedbackId: string) => {
    const feedback = await Feedback.findById(feedbackId)
        .populate('client',     'name phone email status')
        .populate('loggedBy',   'name email')
        .populate('resolvedBy', 'name email');

    if (!feedback) throw new ApiError(404, 'Feedback not found');
    return feedback;
};

export const updateFeedbackService = async (
    feedbackId: string,
    payload: Record<string, any>,
    updatedBy: string
) => {
    const feedback = await Feedback.findById(feedbackId);
    if (!feedback) throw new ApiError(404, 'Feedback not found');

    if (feedback.status === 'RESOLVED') {
        throw new ApiError(400, 'Cannot edit a resolved feedback');
    }

    // Prevent changing client or loggedBy references
    delete payload.client;
    delete payload.loggedBy;
    delete payload.resolvedBy;
    delete payload.resolvedAt;

    Object.assign(feedback, payload);
    await feedback.save();

    return Feedback.findById(feedback._id)
        .populate('client',   'name phone email')
        .populate('loggedBy', 'name email');
};

export const resolveFeedbackService = async (
    feedbackId: string,
    resolvedNote: string,
    resolvedBy: string
) => {
    const feedback = await Feedback.findById(feedbackId);
    if (!feedback) throw new ApiError(404, 'Feedback not found');

    if (feedback.status === 'RESOLVED') {
        throw new ApiError(400, 'Feedback is already resolved');
    }

    feedback.status       = 'RESOLVED';
    feedback.resolvedBy   = new mongoose.Types.ObjectId(resolvedBy);
    feedback.resolvedAt   = new Date();
    feedback.resolvedNote = resolvedNote;

    await feedback.save();

    return Feedback.findById(feedback._id)
        .populate('client',     'name phone email')
        .populate('loggedBy',   'name email')
        .populate('resolvedBy', 'name email');
};

export const deleteFeedbackService = async (feedbackId: string) => {
    const feedback = await Feedback.findById(feedbackId);
    if (!feedback) throw new ApiError(404, 'Feedback not found');

    await Feedback.findByIdAndDelete(feedbackId);
    return { message: 'Feedback deleted successfully' };
};

export const getFeedbacksByClientService = async (
    clientId: string,
    page: number = 1,
    limit: number = 10
) => {
    const client = await Client.findById(clientId);
    if (!client) throw new ApiError(404, 'Client not found');

    const skip = (page - 1) * limit;

    const [feedbacks, total] = await Promise.all([
        Feedback.find({ client: new mongoose.Types.ObjectId(clientId) })
            .populate('loggedBy',   'name email')
            .populate('resolvedBy', 'name email')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit),
        Feedback.countDocuments({ client: new mongoose.Types.ObjectId(clientId) }),
    ]);

    return {
        feedbacks,
        total,
        page,
        totalPages:  Math.ceil(total / limit),
        hasNextPage: page < Math.ceil(total / limit),
        hasPrevPage: page > 1,
    };
};

export const getFeedbackStatsService = async (filters: Record<string, any> = {}) => {
    const matchStage: Record<string, any> = {};

    if (filters.loggedBy)  matchStage.loggedBy = new mongoose.Types.ObjectId(filters.loggedBy);
    if (filters.startDate || filters.endDate) {
        matchStage.createdAt = {};
        if (filters.startDate) matchStage.createdAt.$gte = new Date(filters.startDate);
        if (filters.endDate)   matchStage.createdAt.$lte = new Date(filters.endDate);
    }

    const [byCategory, byRating, byStatus, totals] = await Promise.all([
        Feedback.aggregate([
            { $match: matchStage },
            { $group: { _id: '$category', count: { $sum: 1 }, avgRating: { $avg: '$rating' } } },
            { $sort: { count: -1 } },
        ]),
        Feedback.aggregate([
            { $match: matchStage },
            { $group: { _id: '$rating', count: { $sum: 1 } } },
            { $sort: { _id: 1 } },
        ]),
        Feedback.aggregate([
            { $match: matchStage },
            { $group: { _id: '$status', count: { $sum: 1 } } },
        ]),
        Feedback.aggregate([
            { $match: matchStage },
            {
                $group: {
                    _id:       null,
                    total:     { $sum: 1 },
                    avgRating: { $avg: '$rating' },
                    open:      { $sum: { $cond: [{ $eq: ['$status', 'OPEN'] }, 1, 0] } },
                    resolved:  { $sum: { $cond: [{ $eq: ['$status', 'RESOLVED'] }, 1, 0] } },
                },
            },
        ]),
    ]);

    const summary = totals[0] || { total: 0, avgRating: 0, open: 0, resolved: 0 };

    return {
        summary: {
            total:     summary.total,
            open:      summary.open,
            resolved:  summary.resolved,
            avgRating: summary.avgRating ? Number(summary.avgRating.toFixed(2)) : 0,
        },
        byCategory,
        byRating,
        byStatus,
    };
};