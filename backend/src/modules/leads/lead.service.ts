import { Op, fn, col } from 'sequelize';
import Lead from './lead.model';
import { ApiError } from '../../utils/ApiError';
import {
    LeadStatus,
    TERMINAL_STATUSES,
} from './lead.constants';
import User from '../auth/auth.model';

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
    const newLog = {
        action,
        description,
        performedBy,
        performedAt: new Date(),
        previousStatus,
        newStatus,
        metadata,
    };
    lead.activityLog = [...(lead.activityLog || []), newLog];
    lead.changed('activityLog', true);
};

// ── Helper: build filter query ────────────────────────────────────────────────
const buildFilterQuery = (query: Record<string, any>) => {
    const filter: Record<string, any> = {};

    if (query.tenantId)   filter.tenantId   = query.tenantId;
    if (query.status)     filter.status     = query.status;
    if (query.source)     filter.source     = query.source;
    if (query.priority)   filter.priority   = query.priority;
    if (query.assignedTo) filter.assignedTo = query.assignedTo;
    if (query.interestedProjectId) filter.interestedProjectId = query.interestedProjectId;

    if (query.startDate || query.endDate) {
        filter.createdAt = {};
        if (query.startDate) filter.createdAt[Op.gte] = new Date(query.startDate);
        if (query.endDate)   filter.createdAt[Op.lte] = new Date(new Date(query.endDate).setHours(23, 59, 59));
    }

    if (query.followUpToday === 'true') {
        const today    = new Date(); today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(); tomorrow.setHours(23, 59, 59, 999);
        filter.nextFollowUpDate = { [Op.between]: [today, tomorrow] };
    }

    if (query.search) {
        filter[Op.or] = [
            { name:  { [Op.iLike]: `%${query.search}%` } },
            { phone: { [Op.iLike]: `%${query.search}%` } },
            { email: { [Op.iLike]: `%${query.search}%` } },
        ];
    }

    return filter;
};

// ── Create Lead ───────────────────────────────────────────────────────────────
export const createLeadService = async (
    data: Record<string, any>,
    createdBy: string,
    tenantId: string
) => {
    const lead = Lead.build({
        ...data,
        tenantId,
        createdBy,
        interestedProjectId: data.interestedProject,
        interestedUnitId:    data.interestedUnit,
        enquiryId:         data.enquiryId,
    });

    addActivity(lead, 'CREATED', `Lead created from ${data.source}`, createdBy);

    if (data.assignedTo) {
        lead.assignedBy = createdBy;
        lead.assignedAt = new Date();
        addActivity(lead, 'ASSIGNED', `Lead assigned to sales executive`, createdBy, undefined, undefined, { assignedTo: data.assignedTo });
    }

    await lead.save();

    if (data.assignedTo) {
        const { createClientFromLeadService } = await import('../clients/client.service');
        // Await createClientFromLeadService(lead, createdBy, 'ASSIGNED'); // To be migrated
    }

    return lead;
};

// ── Get All Leads ─────────────────────────────────────────────────────────────
export const getAllLeadsService = async (
    query: Record<string, any>,
    page: number = 1,
    limit: number = 10,
    tenantId: string
) => {
    query.tenantId = tenantId;
    const filter = buildFilterQuery(query);
    const offset = (page - 1) * limit;

    const { rows: leads, count: total } = await Lead.findAndCountAll({
        where: filter,
        include: [
            { model: User, as: 'assignedUser', attributes: ['id', 'name', 'email', 'phone'] },
            { model: User, as: 'creator', attributes: ['id', 'name', 'email'] },
        ],
        attributes: { exclude: ['activityLog', 'reassignmentHistory'] },
        order: [['createdAt', 'DESC']],
        limit,
        offset,
    });

    return {
        leads,
        total,
        page,
        totalPages:  Math.ceil(total / limit),
        hasNextPage: page < Math.ceil(total / limit),
        hasPrevPage: page > 1,
    };
};

// ── Get Single Lead ───────────────────────────────────────────────────────────
export const getLeadByIdService = async (leadId: string, tenantId: string) => {
    const lead = await Lead.findOne({
        where: { id: leadId, tenantId },
        include: [
            { model: User, as: 'assignedUser', attributes: ['id', 'name', 'email', 'phone'] },
            { model: User, as: 'creator', attributes: ['id', 'name', 'email'] },
        ]
    });

    if (!lead) throw new ApiError(404, 'Lead not found');
    return lead;
};

// ── Update Lead Details ───────────────────────────────────────────────────────
export const updateLeadService = async (
    leadId: string,
    data: Record<string, any>,
    updatedBy: string,
    tenantId: string
) => {
    const lead = await Lead.findOne({ where: { id: leadId, tenantId } });
    if (!lead) throw new ApiError(404, 'Lead not found');

    if (TERMINAL_STATUSES.includes(lead.status as LeadStatus)) {
        throw new ApiError(400, `Cannot edit a lead with status: ${lead.status}`);
    }

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

    return lead;
};

// ── Update Lead Status ────────────────────────────────────────────────────────
export const updateLeadStatusService = async (
    leadId: string,
    newStatus: LeadStatus,
    updatedBy: string,
    tenantId: string,
    notes?: string,
    lostReason?: string,
    duplicateOfLead?: string
) => {
    const lead = await Lead.findOne({ where: { id: leadId, tenantId } });
    if (!lead) throw new ApiError(404, 'Lead not found');

    const currentStatus = lead.status as LeadStatus;
    if (currentStatus === newStatus) {
        throw new ApiError(400, `Lead is already in status ${newStatus}`);
    }

    const previousStatus = currentStatus;
    lead.status = newStatus;

    if (newStatus === 'LOST') {
        if (!lostReason) throw new ApiError(400, 'Lost reason is required');
        lead.lostReason = lostReason;
    }

    if (newStatus === 'DUPLICATE') {
        if (!duplicateOfLead) throw new ApiError(400, 'Original lead ID is required');
        lead.duplicateOfLeadId = duplicateOfLead;
    }

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
        // await createClientFromLeadService(lead, updatedBy, 'BOOKED');
    }

    return lead;
};

// ── Assign / Reassign Lead ────────────────────────────────────────────────────
export const assignLeadService = async (
    leadId: string,
    newAssigneeId: string,
    assignedBy: string,
    tenantId: string,
    reason?: string
) => {
    const lead = await Lead.findOne({ where: { id: leadId, tenantId } });
    if (!lead) throw new ApiError(404, 'Lead not found');

    if (TERMINAL_STATUSES.includes(lead.status as LeadStatus)) {
        throw new ApiError(400, `Cannot reassign a lead with status: ${lead.status}`);
    }

    const previousAssignee = lead.assignedTo;

    if (previousAssignee) {
        const newReassignment = {
            fromExecutive: previousAssignee,
            toExecutive:   newAssigneeId,
            reassignedBy:  assignedBy,
            reassignedAt:  new Date(),
            reason,
        };
        lead.reassignmentHistory = [...(lead.reassignmentHistory || []), newReassignment];
        lead.changed('reassignmentHistory', true);
    }

    lead.assignedTo = newAssigneeId;
    lead.assignedBy = assignedBy;
    lead.assignedAt = new Date();

    addActivity(
        lead,
        'REASSIGNED',
        `Lead ${previousAssignee ? 'reassigned' : 'assigned'} to new sales executive${reason ? ` — Reason: ${reason}` : ''}`,
        assignedBy,
        undefined,
        undefined,
        { newAssignee: newAssigneeId, previousAssignee: previousAssignee }
    );

    await lead.save();
    return lead;
};

// ── Delete Lead ───────────────────────────────────────────────────────────────
export const deleteLeadService = async (leadId: string, tenantId: string) => {
    const lead = await Lead.findOne({ where: { id: leadId, tenantId } });
    if (!lead) throw new ApiError(404, 'Lead not found');

    if (['BOOKED', 'CLOSED', 'PAYMENT_IN_PROGRESS'].includes(lead.status)) {
        throw new ApiError(400, `Cannot delete a lead with status: ${lead.status}`);
    }

    await lead.destroy();
    return { message: 'Lead deleted successfully' };
};

// ── Get Lead Stats ────────────────────────────────────────────────────────────
export const getLeadStatsService = async (filters: Record<string, any> = {}, tenantId: string) => {
    const where: any = { tenantId };
    if (filters.assignedTo) where.assignedTo = filters.assignedTo;
    
    // Simplistic count per status using Sequelize
    const byStatus = await Lead.findAll({
        attributes: ['status', [fn('COUNT', col('id')), 'count']],
        where,
        group: ['status']
    });

    const bySource = await Lead.findAll({
        attributes: ['source', [fn('COUNT', col('id')), 'count']],
        where,
        group: ['source']
    });

    const byPriority = await Lead.findAll({
        attributes: ['priority', [fn('COUNT', col('id')), 'count']],
        where,
        group: ['priority']
    });

    return {
        summary: { total: await Lead.count({ where }) },
        byStatus,
        bySource,
        byPriority,
    };
};

export const getLeadActivityService = async (leadId: string, tenantId: string) => {
    const lead = await Lead.findOne({
        where: { id: leadId, tenantId },
        attributes: ['activityLog', 'name', 'phone', 'status']
    });

    if (!lead) throw new ApiError(404, 'Lead not found');
    return lead;
};