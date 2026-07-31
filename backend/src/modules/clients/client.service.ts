import { Op } from 'sequelize';
import ExcelJS from 'exceljs';
import { ApiError } from '../../utils/ApiError';
// import { Booking } from '../bookings/booking.model';
// import { Payment } from '../payments/payment.model';
import { exportClients, importClients } from '../imports-exports/importExport.service';
import { Client } from './client.model';
import Lead from '../leads/lead.model';
import User from '../auth/auth.model';

const maskAadhaar = (aadhaarNumber?: string): string | undefined => {
    if (!aadhaarNumber) return undefined;
    const clean = aadhaarNumber.replace(/\s+/g, '');
    if (clean.length <= 4) return clean;
    return `XXXX-XXXX-${clean.slice(-4)}`;
};

const sanitizeClient = (client: any) => {
    const raw = typeof client.toJSON === 'function' ? client.toJSON() : client;
    return {
        ...raw,
        aadhaarNumber: maskAadhaar(raw.aadhaarNumber),
    };
};

const addActivity = (
    client: any,
    action: string,
    description: string,
    performedBy: string,
    metadata?: Record<string, unknown>
) => {
    const newLog = {
        action,
        description,
        performedBy,
        performedAt: new Date(),
        metadata,
    };
    client.activityLog = [...(client.activityLog || []), newLog];
    client.changed('activityLog', true);
};

export const createClientService = async (payload: Record<string, any>, createdBy: string, tenantId: string) => {
    const existing = await Client.findOne({ where: { phone: payload.phone, tenantId } });
    if (existing) throw new ApiError(409, 'Client with this phone already exists');

    const client = Client.build({
        ...payload,
        tenantId,
        sourceLeadId: payload.sourceLead,
        assignedTo: payload.assignedTo,
        createdBy,
    });

    addActivity(client, 'CREATED', 'Client profile created', createdBy);
    await client.save();

    return sanitizeClient(await Client.findByPk(client.id, {
        include: [
            { model: Lead, as: 'sourceLead', attributes: ['name', 'phone', 'email', 'status', 'propertyType'] },
            { model: User, as: 'assignedUser', attributes: ['name', 'email', 'phone'] },
            { model: User, as: 'creator', attributes: ['name', 'email'] }
        ]
    }));
};

const syncClientFromLead = async (client: any, lead: any, performedBy: string) => {
    let changed = false;

    if (lead.assignedTo && client.assignedTo !== lead.assignedTo) {
        client.assignedTo = lead.assignedTo;
        addActivity(client, 'REASSIGNED', 'Client assignee synced with lead assignment', performedBy, {
            assignedTo: lead.assignedTo,
        });
        changed = true;
    }

    if (!client.sourceLeadId) {
        client.sourceLeadId = lead.id;
        addActivity(client, 'LINKED_TO_LEAD', 'Existing client linked to assigned lead', performedBy, {
            sourceLead: lead.id,
        });
        changed = true;
    }

    if (changed) await client.save();
    return client;
};

export const createClientFromLeadService = async (
    lead: any,
    performedBy: string,
    reason: 'ASSIGNED' | 'BOOKED' = 'BOOKED'
) => {
    if (!lead.assignedTo) return null;

    const existingByLead = await Client.findOne({ where: { sourceLeadId: lead.id, tenantId: lead.tenantId } });
    if (existingByLead) {
        return syncClientFromLead(existingByLead, lead, performedBy);
    }

    const existingByPhone = await Client.findOne({ where: { phone: lead.phone, tenantId: lead.tenantId } });
    if (existingByPhone) {
        return syncClientFromLead(existingByPhone, lead, performedBy);
    }

    const client = Client.build({
        name: lead.name,
        phone: lead.phone,
        email: lead.email,
        tenantId: lead.tenantId,
        assignedTo: lead.assignedTo,
        sourceLeadId: lead.id,
        createdBy: lead.createdBy || performedBy,
        status: 'ACTIVE',
        notes: lead.notes,
    });

    const description =
        reason === 'ASSIGNED'
            ? 'Client auto-created when lead was assigned'
            : 'Client auto-created when lead status moved to BOOKED';

    addActivity(client, reason === 'ASSIGNED' ? 'AUTO_CREATED_FROM_ASSIGNMENT' : 'AUTO_CREATED_FROM_LEAD', description, performedBy, {
        sourceLead: lead.id,
    });
    await client.save();
    return client;
};

const buildFilterQuery = (query: Record<string, any>) => {
    const filter: Record<string, any> = {};

    if (query.tenantId) filter.tenantId = query.tenantId;
    if (query.assignedTo) filter.assignedTo = query.assignedTo;
    if (query.status) filter.status = query.status;
    if (query.kycVerified !== undefined) filter.kycVerified = query.kycVerified === 'true';

    if (query.startDate || query.endDate) {
        filter.createdAt = {};
        if (query.startDate) filter.createdAt[Op.gte] = new Date(query.startDate);
        if (query.endDate) filter.createdAt[Op.lte] = new Date(new Date(query.endDate).setHours(23, 59, 59, 999));
    }

    if (query.search) {
        filter[Op.or] = [
            { name: { [Op.iLike]: `%${query.search}%` } },
            { phone: { [Op.iLike]: `%${query.search}%` } },
            { email: { [Op.iLike]: `%${query.search}%` } },
        ];
    }

    return filter;
};

export const getAllClientsService = async (query: Record<string, any>, page = 1, limit = 10, tenantId: string) => {
    query.tenantId = tenantId;
    const filter = buildFilterQuery(query);
    const offset = (page - 1) * limit;

    const { rows: clients, count: total } = await Client.findAndCountAll({
        where: filter,
        include: [
            { model: Lead, as: 'sourceLead', attributes: ['name', 'phone', 'email', 'status', 'propertyType'] },
            { model: User, as: 'assignedUser', attributes: ['name', 'email', 'phone'] },
            { model: User, as: 'creator', attributes: ['name', 'email'] }
        ],
        attributes: { exclude: ['activityLog'] },
        order: [['createdAt', 'DESC']],
        limit,
        offset,
    });

    const sanitized = clients.map((item) => sanitizeClient(item));
    return {
        clients: sanitized,
        total,
        page,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page < Math.ceil(total / limit),
        hasPrevPage: page > 1,
    };
};

export const getClientByIdService = async (clientId: string, tenantId: string) => {
    const client = await Client.findOne({
        where: { id: clientId, tenantId },
        include: [
            { model: Lead, as: 'sourceLead', attributes: ['name', 'phone', 'email', 'status', 'propertyType'] },
            { model: User, as: 'assignedUser', attributes: ['name', 'email', 'phone'] },
            { model: User, as: 'creator', attributes: ['name', 'email'] }
        ]
    });

    if (!client) throw new ApiError(404, 'Client not found');
    return sanitizeClient(client);
};

export const updateClientService = async (clientId: string, payload: Record<string, any>, updatedBy: string, tenantId: string) => {
    const client = await Client.findOne({ where: { id: clientId, tenantId } });
    if (!client) throw new ApiError(404, 'Client not found');

    Object.assign(client, {
        ...payload,
        sourceLeadId: payload.sourceLead ? payload.sourceLead : client.sourceLeadId,
        assignedTo: payload.assignedTo ? payload.assignedTo : client.assignedTo,
    });

    addActivity(client, 'UPDATED', 'Client profile updated', updatedBy);
    await client.save();
    return sanitizeClient(client);
};

export const deleteClientService = async (clientId: string, tenantId: string) => {
    const client = await Client.findOne({ where: { id: clientId, tenantId } });
    if (!client) throw new ApiError(404, 'Client not found');
    await client.destroy();
    return { message: 'Client deleted successfully' };
};

export const uploadClientDocumentsService = async (
    clientId: string,
    payload: { aadhaarDocument?: string; panDocument?: string; kycVerified?: boolean; notes?: string },
    performedBy: string,
    tenantId: string
) => {
    const client = await Client.findOne({ where: { id: clientId, tenantId } });
    if (!client) throw new ApiError(404, 'Client not found');

    if (payload.aadhaarDocument) client.aadhaarDocument = payload.aadhaarDocument;
    if (payload.panDocument) client.panDocument = payload.panDocument;
    if (typeof payload.kycVerified === 'boolean') client.kycVerified = payload.kycVerified;
    if (payload.notes !== undefined) client.notes = payload.notes;

    addActivity(client, 'DOCUMENTS_UPDATED', 'Client KYC documents updated', performedBy, {
        aadhaarDocument: Boolean(payload.aadhaarDocument),
        panDocument: Boolean(payload.panDocument),
        kycVerified: payload.kycVerified,
    });

    await client.save();
    return sanitizeClient(client);
};

export const getClientBookingsService = async (clientId: string, tenantId: string) => {
    await getClientByIdService(clientId, tenantId);
    /*
    const bookings = await Booking.findAll({
        where: { clientId },
        include: [...],
        order: [['createdAt', 'DESC']]
    });
    return bookings;
    */
    return []; // TODO: restore once Booking is migrated
};

export const getClientPaymentsService = async (clientId: string, tenantId: string) => {
    await getClientByIdService(clientId, tenantId);
    /*
    const payments = await Payment.findAll({
        where: { clientId },
        order: [['createdAt', 'DESC']]
    });
    return payments;
    */
    return []; // TODO: restore once Payment is migrated
};

export const importClientsService = async (buffer: Buffer, uploaderId: string, adminOverrideAgentId?: string) =>
    importClients(buffer, uploaderId, adminOverrideAgentId);

export const exportClientsService = async (filters: {
    agentId?: string;
    startDate?: string;
    endDate?: string;
}): Promise<ExcelJS.Buffer> => exportClients(filters);
