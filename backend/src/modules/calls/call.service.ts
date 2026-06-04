import mongoose from 'mongoose';
import { ApiError } from '../../utils/ApiError';
import { Client } from '../clients/client.model';
import { Call } from './call.model';

// ── Helper: build filter query ────────────────────────────────────────────────
const buildFilterQuery = (query: Record<string, any>) => {
    const filter: Record<string, any> = {};

    if (query.client)    filter.client    = new mongoose.Types.ObjectId(query.client);
    if (query.loggedBy)  filter.loggedBy  = new mongoose.Types.ObjectId(query.loggedBy);
    if (query.outcome)   filter.outcome   = query.outcome;
    if (query.direction) filter.direction = query.direction;
    if (query.purpose)   filter.purpose   = query.purpose;

    if (query.startDate || query.endDate) {
        filter.callDate = {};
        if (query.startDate) filter.callDate.$gte = new Date(query.startDate);
        if (query.endDate)   filter.callDate.$lte = new Date(new Date(query.endDate).setHours(23, 59, 59, 999));
    }

    // Calls with next follow-up due today
    if (query.nextCallToday === 'true') {
        const today    = new Date(); today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(); tomorrow.setHours(23, 59, 59, 999);
        filter.nextCallDate = { $gte: today, $lte: tomorrow };
    }

    return filter;
};

// ── Create Call ───────────────────────────────────────────────────────────────
export const createCallService = async (
    payload: Record<string, any>,
    loggedBy: string
) => {
    const client = await Client.findById(payload.client);
    if (!client) throw new ApiError(404, 'Client not found');

    const call = await Call.create({
        ...payload,
        client:  new mongoose.Types.ObjectId(payload.client),
        loggedBy: new mongoose.Types.ObjectId(loggedBy),
    });

    return call
        .populate('client', 'name phone email')
        .then((c) => c.populate('loggedBy', 'name email'));
};

// ── Get All Calls ─────────────────────────────────────────────────────────────
export const getAllCallsService = async (
    query: Record<string, any>,
    page: number = 1,
    limit: number = 10
) => {
    const filter = buildFilterQuery(query);
    const skip   = (page - 1) * limit;

    const [calls, total] = await Promise.all([
        Call.find(filter)
            .populate('client',   'name phone email')
            .populate('loggedBy', 'name email')
            .sort({ callDate: -1 })
            .skip(skip)
            .limit(limit),
        Call.countDocuments(filter),
    ]);

    return {
        calls,
        total,
        page,
        totalPages:  Math.ceil(total / limit),
        hasNextPage: page < Math.ceil(total / limit),
        hasPrevPage: page > 1,
    };
};

// ── Get Single Call ───────────────────────────────────────────────────────────
export const getCallByIdService = async (callId: string) => {
    const call = await Call.findById(callId)
        .populate('client',   'name phone email status')
        .populate('loggedBy', 'name email');

    if (!call) throw new ApiError(404, 'Call not found');
    return call;
};

// ── Update Call ───────────────────────────────────────────────────────────────
export const updateCallService = async (
    callId: string,
    payload: Record<string, any>,
    updatedBy: string
) => {
    const call = await Call.findById(callId);
    if (!call) throw new ApiError(404, 'Call not found');

    // Only the person who logged the call or admin roles can edit
    if (call.loggedBy.toString() !== updatedBy) {
        throw new ApiError(403, 'You are not authorised to edit this call log');
    }

    // Prevent changing the client reference after creation
    delete payload.client;
    delete payload.loggedBy;

    Object.assign(call, payload);
    await call.save();

    return call
        .populate('client',   'name phone email')
        .then((c) => c.populate('loggedBy', 'name email'));
};

// ── Delete Call ───────────────────────────────────────────────────────────────
export const deleteCallService = async (callId: string) => {
    const call = await Call.findById(callId);
    if (!call) throw new ApiError(404, 'Call not found');

    await Call.findByIdAndDelete(callId);
    return { message: 'Call log deleted successfully' };
};

// ── Get Calls for a Specific Client ──────────────────────────────────────────
export const getCallsByClientService = async (
    clientId: string,
    page: number = 1,
    limit: number = 10
) => {
    const client = await Client.findById(clientId);
    if (!client) throw new ApiError(404, 'Client not found');

    const skip = (page - 1) * limit;

    const [calls, total] = await Promise.all([
        Call.find({ client: new mongoose.Types.ObjectId(clientId) })
            .populate('loggedBy', 'name email')
            .sort({ callDate: -1 })
            .skip(skip)
            .limit(limit),
        Call.countDocuments({ client: new mongoose.Types.ObjectId(clientId) }),
    ]);

    return {
        calls,
        total,
        page,
        totalPages:  Math.ceil(total / limit),
        hasNextPage: page < Math.ceil(total / limit),
        hasPrevPage: page > 1,
    };
};

// ── Get Call Stats ────────────────────────────────────────────────────────────
export const getCallStatsService = async (filters: Record<string, any> = {}) => {
    const matchStage: Record<string, any> = {};

    if (filters.loggedBy)  matchStage.loggedBy  = new mongoose.Types.ObjectId(filters.loggedBy);
    if (filters.client)    matchStage.client     = new mongoose.Types.ObjectId(filters.client);
    if (filters.startDate || filters.endDate) {
        matchStage.callDate = {};
        if (filters.startDate) matchStage.callDate.$gte = new Date(filters.startDate);
        if (filters.endDate)   matchStage.callDate.$lte = new Date(filters.endDate);
    }

    const [byOutcome, byPurpose, byDirection, totals] = await Promise.all([
        Call.aggregate([
            { $match: matchStage },
            { $group: { _id: '$outcome', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
        ]),
        Call.aggregate([
            { $match: matchStage },
            { $group: { _id: '$purpose', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
        ]),
        Call.aggregate([
            { $match: matchStage },
            { $group: { _id: '$direction', count: { $sum: 1 } } },
        ]),
        Call.aggregate([
            { $match: matchStage },
            {
                $group: {
                    _id:             null,
                    total:           { $sum: 1 },
                    totalDuration:   { $sum: { $ifNull: ['$duration', 0] } },
                    answered:        { $sum: { $cond: [{ $eq: ['$outcome', 'ANSWERED'] }, 1, 0] } },
                    withNextCall:    { $sum: { $cond: [{ $ifNull: ['$nextCallDate', false] }, 1, 0] } },
                },
            },
        ]),
    ]);

    const summary = totals[0] || { total: 0, totalDuration: 0, answered: 0, withNextCall: 0 };

    return {
        summary: {
            total:          summary.total,
            answered:       summary.answered,
            withNextCall:   summary.withNextCall,
            totalDurationSeconds: summary.totalDuration,
            answerRate:     summary.total > 0
                ? ((summary.answered / summary.total) * 100).toFixed(1) + '%'
                : '0%',
        },
        byOutcome,
        byPurpose,
        byDirection,
    };
};