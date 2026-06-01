import mongoose from 'mongoose';
import { FollowUp, FollowUpStatus } from './followup.model';
import { Lead } from '../leads/lead.model';
import { ApiError } from '../../utils/ApiError';

// ── Helper: build filter ───────────────────────────────────────────────────────
const buildFilter = (query: Record<string, any>) => {
    const filter: Record<string, any> = {};

    if (query.lead)       filter.lead       = new mongoose.Types.ObjectId(query.lead);
    if (query.assignedTo) filter.assignedTo = new mongoose.Types.ObjectId(query.assignedTo);
    if (query.status)     filter.status     = query.status;
    if (query.type)       filter.type       = query.type;

    if (query.startDate || query.endDate) {
        filter.scheduledAt = {};
        if (query.startDate) filter.scheduledAt.$gte = new Date(query.startDate);
        if (query.endDate)   filter.scheduledAt.$lte = new Date(new Date(query.endDate).setHours(23, 59, 59));
    }

    // Today's follow-ups
    if (query.today === 'true') {
        const start = new Date(); start.setHours(0, 0, 0, 0);
        const end   = new Date(); end.setHours(23, 59, 59, 999);
        filter.scheduledAt = { $gte: start, $lte: end };
    }

    // Overdue — scheduled in past and not completed/cancelled
    if (query.overdue === 'true') {
        filter.scheduledAt = { $lt: new Date() };
        filter.status      = { $in: ['SCHEDULED', 'PENDING'] };
    }

    return filter;
};

// ── Create Follow-Up ──────────────────────────────────────────────────────────
export const createFollowUpService = async (
    data: {
        lead:        string;
        assignedTo:  string;
        type:        string;
        scheduledAt: Date;
        notes?:      string;
    },
    createdBy: string
) => {
    // Verify lead exists
    const lead = await Lead.findById(data.lead);
    if (!lead) throw new ApiError(404, 'Lead not found');

    const followUp = await FollowUp.create({
        lead:        new mongoose.Types.ObjectId(data.lead),
        assignedTo:  new mongoose.Types.ObjectId(data.assignedTo),
        createdBy:   new mongoose.Types.ObjectId(createdBy),
        type:        data.type as any,
        scheduledAt: data.scheduledAt,
        notes:       data.notes,
        status:      'SCHEDULED',
    });

    // Update lead's nextFollowUpDate
    await Lead.findByIdAndUpdate(data.lead, {
        $set: { nextFollowUpDate: data.scheduledAt },
    });

    // Add activity to lead
    await Lead.findByIdAndUpdate(data.lead, {
        $push: {
            activityLog: {
                action:      'FOLLOWUP_SCHEDULED',
                description: `${data.type} follow-up scheduled for ${new Date(data.scheduledAt).toLocaleString('en-IN')}`,
                performedBy: new mongoose.Types.ObjectId(createdBy),
                performedAt: new Date(),
            },
        },
    });

    // Notify the assigned executive
    const { Notification } = await import('../notifications/notification.model');
    await Notification.create({
        userId:   new mongoose.Types.ObjectId(data.assignedTo),
        title:    'Follow-Up Scheduled',
        message:  `A ${data.type} follow-up has been scheduled for lead ${lead.name} (${lead.phone}) on ${new Date(data.scheduledAt).toLocaleString('en-IN')}.`,
        type:     'FollowUp',
        refId:    (followUp as any)._id,
        refModel: 'FollowUp',
    });

    return (followUp as any).populate([
        { path: 'lead',       select: 'name phone status' },
        { path: 'assignedTo', select: 'name email phone' },
        { path: 'createdBy',  select: 'name email' },
    ]);
};

// ── Get All Follow-Ups ────────────────────────────────────────────────────────
export const getAllFollowUpsService = async (
    query:  Record<string, any>,
    page:   number = 1,
    limit:  number = 10
) => {
    const filter = buildFilter(query);
    const skip   = (page - 1) * limit;

    const [followUps, total] = await Promise.all([
        FollowUp.find(filter)
            .populate('lead',       'name phone status priority')
            .populate('assignedTo', 'name email phone')
            .populate('createdBy',  'name email')
            .sort({ scheduledAt: 1 }) // soonest first
            .skip(skip)
            .limit(limit),
        FollowUp.countDocuments(filter),
    ]);

    return {
        followUps,
        total,
        page,
        totalPages:  Math.ceil(total / limit),
        hasNextPage: page < Math.ceil(total / limit),
        hasPrevPage: page > 1,
    };
};

// ── Get Single Follow-Up ──────────────────────────────────────────────────────
export const getFollowUpByIdService = async (followUpId: string) => {
    const followUp = await FollowUp.findById(followUpId)
        .populate('lead',             'name phone email status priority assignedTo')
        .populate('assignedTo',       'name email phone')
        .populate('createdBy',        'name email')
        .populate('rescheduledFrom',  'scheduledAt type status');

    if (!followUp) throw new ApiError(404, 'Follow-up not found');
    return followUp;
};

// ── Update Follow-Up Details ──────────────────────────────────────────────────
export const updateFollowUpService = async (
    followUpId: string,
    data:       Record<string, any>
) => {
    const followUp = await FollowUp.findById(followUpId);
    if (!followUp) throw new ApiError(404, 'Follow-up not found');

    if (['COMPLETED', 'CANCELLED'].includes(followUp.status)) {
        throw new ApiError(400, `Cannot edit a ${followUp.status} follow-up`);
    }

    const updated = await FollowUp.findByIdAndUpdate(
        followUpId,
        { $set: data },
        { new: true, runValidators: true }
    ).populate('assignedTo', 'name email');

    return updated;
};

// ── Complete Follow-Up ────────────────────────────────────────────────────────
export const completeFollowUpService = async (
    followUpId: string,
    outcome:    string,
    notes:      string = '',
    completedBy: string,
    nextFollowUp?: {
        type:        string;
        scheduledAt: Date;
        notes?:      string;
    }
) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const followUp = await FollowUp.findById(followUpId).session(session);
        if (!followUp) throw new ApiError(404, 'Follow-up not found');

        if (followUp.status === 'COMPLETED') {
            throw new ApiError(400, 'Follow-up is already completed');
        }
        if (followUp.status === 'CANCELLED') {
            throw new ApiError(400, 'Cannot complete a cancelled follow-up');
        }

        // Mark complete
        followUp.status      = 'COMPLETED';
        followUp.completedAt = new Date();
        followUp.outcome     = outcome;
        if (notes) followUp.notes = notes;
        await followUp.save({ session });

        // Add activity to lead
        await Lead.findByIdAndUpdate(
            followUp.lead,
            {
                $set:  { lastContactedAt: new Date() },
                $push: {
                    activityLog: {
                        action:      'FOLLOWUP_COMPLETED',
                        description: `${followUp.type} follow-up completed. Outcome: ${outcome}`,
                        performedBy: new mongoose.Types.ObjectId(completedBy),
                        performedAt: new Date(),
                        metadata:    { followUpId: followUp._id, outcome },
                    },
                },
            },
            { session }
        );

        let newFollowUp = null;

        // Optionally create next follow-up
        if (nextFollowUp) {
            const createdDocs = await FollowUp.create(
                [
                    {
                        lead:        followUp.lead,
                        assignedTo:  followUp.assignedTo,
                        createdBy:   new mongoose.Types.ObjectId(completedBy),
                        type:        nextFollowUp.type,
                        scheduledAt: nextFollowUp.scheduledAt,
                        notes:       nextFollowUp.notes,
                        status:      'SCHEDULED',
                    },
                ] as any,
                { session }
            );
            const created = (createdDocs as any)[0];
            newFollowUp = created;

            // Update lead's nextFollowUpDate
            await Lead.findByIdAndUpdate(
                followUp.lead,
                { $set: { nextFollowUpDate: nextFollowUp.scheduledAt } },
                { session }
            );

            // Notify executive of next follow-up
            const { Notification } = await import('../notifications/notification.model');
            await Notification.create(
                [
                    {
                        userId:   followUp.assignedTo,
                        title:    'Next Follow-Up Scheduled',
                        message:  `Your next ${nextFollowUp.type} follow-up has been scheduled for ${new Date(nextFollowUp.scheduledAt).toLocaleString('en-IN')}.`,
                        type:     'FollowUp',
                        refId:    created._id,
                        refModel: 'FollowUp',
                    },
                ],
                { session }
            );
        } else {
            // Clear nextFollowUpDate on lead since no next one scheduled
            await Lead.findByIdAndUpdate(
                followUp.lead,
                { $unset: { nextFollowUpDate: '' } },
                { session }
            );
        }

        await session.commitTransaction();
        session.endSession();

        return {
            completedFollowUp: followUp,
            nextFollowUp:      newFollowUp,
            message: nextFollowUp
                ? `Follow-up completed and next ${nextFollowUp.type} scheduled for ${new Date(nextFollowUp.scheduledAt).toLocaleString('en-IN')}`
                : 'Follow-up completed successfully',
        };

    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        throw error;
    }
};

// ── Reschedule Follow-Up ──────────────────────────────────────────────────────
export const rescheduleFollowUpService = async (
    followUpId:       string,
    newScheduledAt:   Date,
    rescheduleReason: string,
    rescheduledBy:    string,
    notes?:           string
) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const original = await FollowUp.findById(followUpId).session(session);
        if (!original) throw new ApiError(404, 'Follow-up not found');

        if (['COMPLETED', 'CANCELLED'].includes(original.status)) {
            throw new ApiError(400, `Cannot reschedule a ${original.status} follow-up`);
        }

        // Mark original as rescheduled
        original.status           = 'RESCHEDULED';
        original.rescheduledAt    = new Date();
        original.rescheduleReason = rescheduleReason;
        await original.save({ session });

        // Create new follow-up
        const [newFollowUp] = await FollowUp.create(
            [
                {
                    lead:             original.lead,
                    assignedTo:       original.assignedTo,
                    createdBy:        new mongoose.Types.ObjectId(rescheduledBy),
                    type:             original.type,
                    scheduledAt:      newScheduledAt,
                    notes:            notes || original.notes,
                    status:           'SCHEDULED',
                    rescheduledFrom:  original._id,
                },
            ],
            { session }
        );

        // Update lead's nextFollowUpDate
        await Lead.findByIdAndUpdate(
            original.lead,
            {
                $set:  { nextFollowUpDate: newScheduledAt },
                $push: {
                    activityLog: {
                        action:      'FOLLOWUP_RESCHEDULED',
                        description: `${original.type} follow-up rescheduled to ${new Date(newScheduledAt).toLocaleString('en-IN')}. Reason: ${rescheduleReason}`,
                        performedBy: new mongoose.Types.ObjectId(rescheduledBy),
                        performedAt: new Date(),
                    },
                },
            },
            { session }
        );

        // Notify executive
        const { Notification } = await import('../notifications/notification.model');
        await Notification.create(
            [
                {
                    userId:   original.assignedTo,
                    title:    'Follow-Up Rescheduled',
                    message:  `Your ${original.type} follow-up has been rescheduled to ${new Date(newScheduledAt).toLocaleString('en-IN')}. Reason: ${rescheduleReason}`,
                    type:     'FollowUp',
                    refId:    newFollowUp._id,
                    refModel: 'FollowUp',
                },
            ],
            { session }
        );

        await session.commitTransaction();
        session.endSession();

        return {
            rescheduledFollowUp: original,
            newFollowUp,
            message: `Follow-up rescheduled to ${new Date(newScheduledAt).toLocaleString('en-IN')}`,
        };

    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        throw error;
    }
};

// ── Cancel Follow-Up ──────────────────────────────────────────────────────────
export const cancelFollowUpService = async (
    followUpId:   string,
    cancelledBy:  string,
    reason?:      string
) => {
    const followUp = await FollowUp.findById(followUpId);
    if (!followUp) throw new ApiError(404, 'Follow-up not found');

    if (followUp.status === 'COMPLETED') {
        throw new ApiError(400, 'Cannot cancel a completed follow-up');
    }
    if (followUp.status === 'CANCELLED') {
        throw new ApiError(400, 'Follow-up is already cancelled');
    }

    followUp.status = 'CANCELLED';
    if (reason) followUp.notes = reason;
    await followUp.save();

    // Add activity to lead
    await Lead.findByIdAndUpdate(followUp.lead, {
        $push: {
            activityLog: {
                action:      'FOLLOWUP_CANCELLED',
                description: `${followUp.type} follow-up cancelled${reason ? `. Reason: ${reason}` : ''}`,
                performedBy: new mongoose.Types.ObjectId(cancelledBy),
                performedAt: new Date(),
            },
        },
    });

    return { message: 'Follow-up cancelled successfully' };
};

// ── Get Follow-Up Stats ───────────────────────────────────────────────────────
export const getFollowUpStatsService = async (filters: Record<string, any> = {}) => {
    const match: Record<string, any> = {};
    if (filters.assignedTo) match.assignedTo = new mongoose.Types.ObjectId(filters.assignedTo);
    if (filters.startDate || filters.endDate) {
        match.scheduledAt = {};
        if (filters.startDate) match.scheduledAt.$gte = new Date(filters.startDate);
        if (filters.endDate)   match.scheduledAt.$lte = new Date(filters.endDate);
    }

    const now   = new Date();
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const todayEnd = new Date(); todayEnd.setHours(23, 59, 59, 999);

    const [byStatus, byType, totals, todayCount, overdueCount] = await Promise.all([
        FollowUp.aggregate([
            { $match: match },
            { $group: { _id: '$status', count: { $sum: 1 } } },
        ]),
        FollowUp.aggregate([
            { $match: match },
            { $group: { _id: '$type', count: { $sum: 1 } } },
        ]),
        FollowUp.aggregate([
            { $match: match },
            {
                $group: {
                    _id:       null,
                    total:     { $sum: 1 },
                    completed: { $sum: { $cond: [{ $eq: ['$status', 'COMPLETED'] }, 1, 0] } },
                    missed:    { $sum: { $cond: [{ $eq: ['$status', 'MISSED']    }, 1, 0] } },
                },
            },
        ]),
        FollowUp.countDocuments({
            ...match,
            scheduledAt: { $gte: today, $lte: todayEnd },
            status:      { $in: ['SCHEDULED', 'PENDING'] },
        }),
        FollowUp.countDocuments({
            ...match,
            scheduledAt: { $lt: now },
            status:      { $in: ['SCHEDULED', 'PENDING'] },
        }),
    ]);

    const summary = totals[0] || { total: 0, completed: 0, missed: 0 };

    return {
        summary: {
            total:          summary.total,
            completed:      summary.completed,
            missed:         summary.missed,
            todayDue:       todayCount,
            overdue:        overdueCount,
            completionRate: summary.total > 0
                ? ((summary.completed / summary.total) * 100).toFixed(1) + '%'
                : '0%',
        },
        byStatus,
        byType,
    };
};