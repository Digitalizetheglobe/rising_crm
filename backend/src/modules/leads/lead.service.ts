import mongoose from 'mongoose';
import { Lead } from './lead.model';
import { ApiError } from '../../utils/ApiError';
import {
    LeadStatus,
    TERMINAL_STATUSES,
} from './lead.constants';

// ── Helper: add activity log entry ────────────────────────────────────────────
const addActivity = (
    lead: any,
    action: string,
    description: string,
    performedBy: string,
    previousStatus?: LeadStatus,
    newStatus?: LeadStatus,
    metadata?: Record<string, any>
) => {
    lead.activityLog.push({
        action,
        description,
        performedBy:  new mongoose.Types.ObjectId(performedBy),
        performedAt:  new Date(),
        previousStatus,
        newStatus,
        metadata,
    });
};

// ── Helper: build filter query ────────────────────────────────────────────────
const buildFilterQuery = (query: Record<string, any>) => {
    const filter: Record<string, any> = {};

    if (query.status)     filter.status     = query.status;
    if (query.source)     filter.source     = query.source;
    if (query.priority)   filter.priority   = query.priority;
    if (query.assignedTo) filter.assignedTo = new mongoose.Types.ObjectId(query.assignedTo);
    if (query.interestedProject) filter.interestedProject = new mongoose.Types.ObjectId(query.interestedProject);

    if (query.startDate || query.endDate) {
        filter.createdAt = {};
        if (query.startDate) filter.createdAt.$gte = new Date(query.startDate);
        if (query.endDate)   filter.createdAt.$lte = new Date(new Date(query.endDate).setHours(23, 59, 59));
    }

    // Follow-ups due today
    if (query.followUpToday === 'true') {
        const today    = new Date(); today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(); tomorrow.setHours(23, 59, 59, 999);
        filter.nextFollowUpDate = { $gte: today, $lte: tomorrow };
    }

    if (query.search) {
        filter.$or = [
            { name:  { $regex: query.search, $options: 'i' } },
            { phone: { $regex: query.search, $options: 'i' } },
            { email: { $regex: query.search, $options: 'i' } },
        ];
    }

    return filter;
};

// ── Create Lead ───────────────────────────────────────────────────────────────
export const createLeadService = async (
    data: Record<string, any>,
    createdBy: string
) => {
    const lead = new Lead({
        ...data,
        createdBy:         new mongoose.Types.ObjectId(createdBy),
        interestedProject: data.interestedProject ? new mongoose.Types.ObjectId(data.interestedProject) : undefined,
        interestedUnit:    data.interestedUnit    ? new mongoose.Types.ObjectId(data.interestedUnit)    : undefined,
        assignedTo:        data.assignedTo        ? new mongoose.Types.ObjectId(data.assignedTo)        : undefined,
        enquiryId:         data.enquiryId         ? new mongoose.Types.ObjectId(data.enquiryId)         : undefined,
    });

    // Log creation activity
    addActivity(lead, 'CREATED', `Lead created from ${data.source}`, createdBy);

    // Log assignment activity if assigned at creation
    if (data.assignedTo) {
        lead.assignedBy = new mongoose.Types.ObjectId(createdBy);
        lead.assignedAt = new Date();
        addActivity(lead, 'ASSIGNED', `Lead assigned to sales executive`, createdBy, undefined, undefined, { assignedTo: data.assignedTo });
    }

    await lead.save();

    if (data.assignedTo) {
        const { createClientFromLeadService } = await import('../clients/client.service');
        await createClientFromLeadService(lead, createdBy, 'ASSIGNED');
    }

    return lead;
};

// ── Get All Leads ─────────────────────────────────────────────────────────────
export const getAllLeadsService = async (
    query: Record<string, any>,
    page: number = 1,
    limit: number = 10
) => {
    const filter = buildFilterQuery(query);
    const skip   = (page - 1) * limit;

    const [leads, total] = await Promise.all([
        Lead.find(filter)
            .populate('assignedTo',        'name email phone')
            .populate('assignedBy',        'name email')
            .populate('createdBy',         'name email')
            .populate('interestedProject', 'name location')
            .populate('interestedUnit',    'unitNumber type floor price')
            .populate('enquiryId',         'source status')
            .select('-activityLog -reassignmentHistory') // exclude heavy fields in list
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit),
        Lead.countDocuments(filter),
    ]);

    return {
        leads,
        total,
        page,
        totalPages:  Math.ceil(total / limit),
        hasNextPage: page < Math.ceil(total / limit),
        hasPrevPage: page > 1,
    };
};

// ── Get Single Lead (full detail with activity log) ───────────────────────────
export const getLeadByIdService = async (leadId: string) => {
    const lead = await Lead.findById(leadId)
        .populate('assignedTo',        'name email phone')
        .populate('assignedBy',        'name email')
        .populate('createdBy',         'name email')
        .populate('interestedProject', 'name location status')
        .populate('interestedUnit',    'unitNumber type floor price status')
        .populate('enquiryId',         'source status createdAt')
        .populate('duplicateOfLead',   'name phone status')
        .populate('activityLog.performedBy', 'name email')
        .populate('reassignmentHistory.fromExecutive', 'name email')
        .populate('reassignmentHistory.toExecutive',   'name email')
        .populate('reassignmentHistory.reassignedBy',  'name email');

    if (!lead) throw new ApiError(404, 'Lead not found');
    return lead;
};

// ── Update Lead Details ───────────────────────────────────────────────────────
export const updateLeadService = async (
    leadId: string,
    data: Record<string, any>,
    updatedBy: string
) => {
    const lead = await Lead.findById(leadId);
    if (!lead) throw new ApiError(404, 'Lead not found');

    if (TERMINAL_STATUSES.includes(lead.status)) {
        throw new ApiError(400, `Cannot edit a lead with status: ${lead.status}`);
    }

    // Track what changed for activity log
    const changes: string[] = [];
    if (data.priority          && data.priority          !== lead.priority)          changes.push(`Priority changed to ${data.priority}`);
    if (data.budgetRange       && data.budgetRange       !== lead.budgetRange)       changes.push(`Budget range updated to ${data.budgetRange}`);
    if (data.propertyType      && data.propertyType      !== lead.propertyType)      changes.push(`Property type updated to ${data.propertyType}`);
    if (data.preferredLocation && data.preferredLocation !== lead.preferredLocation) changes.push(`Preferred location updated`);
    if (data.nextFollowUpDate)                                                        changes.push(`Next follow-up set to ${new Date(data.nextFollowUpDate).toLocaleDateString('en-IN')}`);

    Object.assign(lead, data);

    if (changes.length > 0) {
        addActivity(lead, 'UPDATED', changes.join('. '), updatedBy);
    }

    await lead.save();

    return lead.populate([
        { path: 'assignedTo', select: 'name email' },
        { path: 'createdBy',  select: 'name email' },
    ]);
};

// ── Update Lead Status ────────────────────────────────────────────────────────
export const updateLeadStatusService = async (
    leadId: string,
    newStatus: LeadStatus,
    updatedBy: string,
    notes?: string,
    lostReason?: string,
    duplicateOfLead?: string
) => {
    const lead = await Lead.findById(leadId);
    if (!lead) throw new ApiError(404, 'Lead not found');

    const currentStatus = lead.status;

    if (currentStatus === newStatus) {
        throw new ApiError(400, `Lead is already in status ${newStatus}`);
    }

    // Store previous for activity log
    const previousStatus = currentStatus;
    lead.status = newStatus;

    // Handle LOST
    if (newStatus === 'LOST') {
        if (!lostReason) throw new ApiError(400, 'Lost reason is required');
        lead.lostReason = lostReason;
    }

    // Handle DUPLICATE
    if (newStatus === 'DUPLICATE') {
        if (!duplicateOfLead) throw new ApiError(400, 'Original lead ID is required');
        lead.duplicateOfLead = new mongoose.Types.ObjectId(duplicateOfLead);
    }

    // Update last contacted if moving forward
    if (['CONTACTED', 'SITE_VISIT_SCHEDULED', 'SITE_VISIT_COMPLETED'].includes(newStatus)) {
        lead.lastContactedAt = new Date();
    }

    if (notes) lead.notes = notes;

    addActivity(
        lead,
        'STATUS_CHANGED',
        `Status changed from ${previousStatus} to ${newStatus}${notes ? ` — ${notes}` : ''}`,
        updatedBy,
        previousStatus,
        newStatus,
        lostReason ? { lostReason } : undefined
    );

    await lead.save();

    if (newStatus === 'BOOKED') {
        const { createClientFromLeadService } = await import('../clients/client.service');
        await createClientFromLeadService(lead, updatedBy, 'BOOKED');
    }

    // Send notification to assigned executive on key milestones
    if (['BOOKED', 'CLOSED', 'LOST'].includes(newStatus) && lead.assignedTo) {
        const { Notification } = await import('../notifications/notification.model');
        await Notification.create({
            UserId:   lead.assignedTo,
            title:    `Lead ${newStatus}`,
            message:  `Lead ${lead.name} (${lead.phone}) has been marked as ${newStatus}.`,
            type:     'Lead',
            refId:    lead._id,
            refModel: 'Lead',
        });
    }

    return lead;
};

// ── Assign / Reassign Lead ────────────────────────────────────────────────────
export const assignLeadService = async (
    leadId: string,
    newAssigneeId: string,
    assignedBy: string,
    reason?: string
) => {
    const lead = await Lead.findById(leadId);
    if (!lead) throw new ApiError(404, 'Lead not found');

    if (TERMINAL_STATUSES.includes(lead.status)) {
        throw new ApiError(400, `Cannot reassign a lead with status: ${lead.status}`);
    }

    const previousAssignee = lead.assignedTo;

    // Push to reassignment history if already assigned
    if (previousAssignee) {
        lead.reassignmentHistory.push({
            fromExecutive: previousAssignee as mongoose.Types.ObjectId,
            toExecutive:   new mongoose.Types.ObjectId(newAssigneeId),
            reassignedBy:  new mongoose.Types.ObjectId(assignedBy),
            reassignedAt:  new Date(),
            reason,
        });
    }

    lead.assignedTo = new mongoose.Types.ObjectId(newAssigneeId);
    lead.assignedBy = new mongoose.Types.ObjectId(assignedBy);
    lead.assignedAt = new Date();

    addActivity(
        lead,
        'REASSIGNED',
        `Lead ${previousAssignee ? 'reassigned' : 'assigned'} to new sales executive${reason ? ` — Reason: ${reason}` : ''}`,
        assignedBy,
        undefined,
        undefined,
        { newAssignee: newAssigneeId, previousAssignee: previousAssignee?.toString() }
    );

    await lead.save();

    const { createClientFromLeadService } = await import('../clients/client.service');
    await createClientFromLeadService(lead, assignedBy, 'ASSIGNED');

    // Notify new assignee
    const { Notification } = await import('../notifications/notification.model');
    await Notification.create({
        UserId:   new mongoose.Types.ObjectId(newAssigneeId),
        title:    'Lead Assigned to You',
        message:  `Lead ${lead.name} (${lead.phone}) has been assigned to you. Current status: ${lead.status}.`,
        type:     'Lead',
        refId:    lead._id,
        refModel: 'Lead',
    });

    return lead.populate('assignedTo', 'name email phone');
};

// ── Delete Lead ───────────────────────────────────────────────────────────────
export const deleteLeadService = async (leadId: string) => {
    const lead = await Lead.findById(leadId);
    if (!lead) throw new ApiError(404, 'Lead not found');

    if (['BOOKED', 'CLOSED', 'PAYMENT_IN_PROGRESS'].includes(lead.status)) {
        throw new ApiError(400, `Cannot delete a lead with status: ${lead.status}`);
    }

    await Lead.findByIdAndDelete(leadId);
    return { message: 'Lead deleted successfully' };
};

// ── Get Lead Stats ────────────────────────────────────────────────────────────
export const getLeadStatsService = async (filters: Record<string, any> = {}) => {
    const matchStage: Record<string, any> = {};
    if (filters.assignedTo)       matchStage.assignedTo       = new mongoose.Types.ObjectId(filters.assignedTo);
    if (filters.interestedProject) matchStage.interestedProject = new mongoose.Types.ObjectId(filters.interestedProject);
    if (filters.startDate || filters.endDate) {
        matchStage.createdAt = {};
        if (filters.startDate) matchStage.createdAt.$gte = new Date(filters.startDate);
        if (filters.endDate)   matchStage.createdAt.$lte = new Date(filters.endDate);
    }

    const [byStatus, bySource, byPriority, totals] = await Promise.all([
        Lead.aggregate([
            { $match: matchStage },
            { $group: { _id: '$status', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
        ]),
        Lead.aggregate([
            { $match: matchStage },
            { $group: { _id: '$source', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
        ]),
        Lead.aggregate([
            { $match: matchStage },
            { $group: { _id: '$priority', count: { $sum: 1 } } },
        ]),
        Lead.aggregate([
            { $match: matchStage },
            {
                $group: {
                    _id:   null,
                    total: { $sum: 1 },
                    won:   { $sum: { $cond: [{ $eq: ['$status', 'CLOSED'] }, 1, 0] } },
                    lost:  { $sum: { $cond: [{ $eq: ['$status', 'LOST']   }, 1, 0] } },
                    active:{ $sum: { $cond: [{ $not: [{ $in: ['$status', ['CLOSED', 'LOST', 'DUPLICATE']] }] }, 1, 0] } },
                },
            },
        ]),
    ]);

    const summary = totals[0] || { total: 0, won: 0, lost: 0, active: 0 };

    return {
        summary: {
            total:          summary.total,
            active:         summary.active,
            won:            summary.won,
            lost:           summary.lost,
            conversionRate: summary.total > 0
                ? ((summary.won / summary.total) * 100).toFixed(1) + '%'
                : '0%',
        },
        byStatus,
        bySource,
        byPriority,
    };
};

// ── Get Activity Log for a Lead ───────────────────────────────────────────────
export const getLeadActivityService = async (leadId: string) => {
    const lead = await Lead.findById(leadId)
        .select('activityLog name phone status')
        .populate('activityLog.performedBy', 'name email');

    if (!lead) throw new ApiError(404, 'Lead not found');
    return lead;
};