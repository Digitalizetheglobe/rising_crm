import mongoose from 'mongoose';
import ExcelJS from 'exceljs';
import { ApiError } from '../../utils/ApiError';
import { Booking } from '../bookings/booking.model';
import { Payment } from '../payments/payment.model';
import { exportClients, importClients } from '../imports-exports/importExport.service';
import { Client } from './client.model';

const maskAadhaar = (aadhaarNumber?: string): string | undefined => {
    if (!aadhaarNumber) return undefined;
    const clean = aadhaarNumber.replace(/\s+/g, '');
    if (clean.length <= 4) return clean;
    return `XXXX-XXXX-${clean.slice(-4)}`;
};

const sanitizeClient = (client: any) => {
    const raw = typeof client.toObject === 'function' ? client.toObject() : client;
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
    client.activityLog.push({
        action,
        description,
        performedBy: new mongoose.Types.ObjectId(performedBy),
        performedAt: new Date(),
        metadata,
    });
};

const toObjectId = (id?: string) => (id ? new mongoose.Types.ObjectId(id) : undefined);

export const createClientService = async (payload: Record<string, any>, createdBy: string) => {
    const existing = await Client.findOne({ phone: payload.phone });
    if (existing) throw new ApiError(409, 'Client with this phone already exists');

    const client = new Client({
        ...payload,
        sourceLead: toObjectId(payload.sourceLead),
        assignedTo: toObjectId(payload.assignedTo),
        createdBy: new mongoose.Types.ObjectId(createdBy),
    });

    addActivity(client, 'CREATED', 'Client profile created', createdBy);
    await client.save();

    const hydrated = await Client.findById(client._id)
        .populate('sourceLead', 'name phone status')
        .populate('assignedTo', 'name email phone')
        .populate('createdBy', 'name email');
    return sanitizeClient(hydrated);
};

export const createClientFromLeadService = async (lead: any, performedBy: string) => {
    const existingByLead = await Client.findOne({ sourceLead: lead._id });
    if (existingByLead) return existingByLead;

    const existingByPhone = await Client.findOne({ phone: lead.phone });
    if (existingByPhone) {
        if (!existingByPhone.sourceLead) {
            existingByPhone.sourceLead = lead._id;
            addActivity(existingByPhone, 'LINKED_TO_LEAD', 'Existing client linked to converted lead', performedBy, {
                sourceLead: lead._id.toString(),
            });
            await existingByPhone.save();
        }
        return existingByPhone;
    }

    const client = new Client({
        name: lead.name,
        phone: lead.phone,
        email: lead.email,
        assignedTo: lead.assignedTo,
        sourceLead: lead._id,
        createdBy: lead.createdBy,
        status: 'ACTIVE',
        notes: lead.notes,
    });

    addActivity(client, 'AUTO_CREATED_FROM_LEAD', 'Client auto-created when lead status moved to BOOKED', performedBy, {
        sourceLead: lead._id.toString(),
    });
    await client.save();
    return client;
};

const buildFilterQuery = (query: Record<string, any>) => {
    const filter: Record<string, any> = {};

    if (query.assignedTo) filter.assignedTo = toObjectId(query.assignedTo);
    if (query.status) filter.status = query.status;
    if (query.kycVerified !== undefined) filter.kycVerified = query.kycVerified === 'true';

    if (query.startDate || query.endDate) {
        filter.createdAt = {};
        if (query.startDate) filter.createdAt.$gte = new Date(query.startDate);
        if (query.endDate) filter.createdAt.$lte = new Date(new Date(query.endDate).setHours(23, 59, 59, 999));
    }

    if (query.search) {
        filter.$or = [
            { name: { $regex: query.search, $options: 'i' } },
            { phone: { $regex: query.search, $options: 'i' } },
            { email: { $regex: query.search, $options: 'i' } },
        ];
    }

    return filter;
};

export const getAllClientsService = async (query: Record<string, any>, page = 1, limit = 10) => {
    const filter = buildFilterQuery(query);
    const skip = (page - 1) * limit;

    const [clients, total] = await Promise.all([
        Client.find(filter)
            .populate('sourceLead', 'name phone status')
            .populate('assignedTo', 'name email phone')
            .populate('createdBy', 'name email')
            .select('-activityLog')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit),
        Client.countDocuments(filter),
    ]);

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

export const getClientByIdService = async (clientId: string) => {
    const client = await Client.findById(clientId)
        .populate('sourceLead', 'name phone status')
        .populate('assignedTo', 'name email phone')
        .populate('createdBy', 'name email')
        .populate('activityLog.performedBy', 'name email');

    if (!client) throw new ApiError(404, 'Client not found');
    return sanitizeClient(client);
};

export const updateClientService = async (clientId: string, payload: Record<string, any>, updatedBy: string) => {
    const client = await Client.findById(clientId);
    if (!client) throw new ApiError(404, 'Client not found');

    Object.assign(client, {
        ...payload,
        sourceLead: payload.sourceLead ? toObjectId(payload.sourceLead) : client.sourceLead,
        assignedTo: payload.assignedTo ? toObjectId(payload.assignedTo) : client.assignedTo,
    });

    addActivity(client, 'UPDATED', 'Client profile updated', updatedBy);
    await client.save();
    return sanitizeClient(client);
};

export const deleteClientService = async (clientId: string) => {
    const client = await Client.findById(clientId);
    if (!client) throw new ApiError(404, 'Client not found');
    await Client.findByIdAndDelete(clientId);
    return { message: 'Client deleted successfully' };
};

export const uploadClientDocumentsService = async (
    clientId: string,
    payload: { aadhaarDocument?: string; panDocument?: string; kycVerified?: boolean; notes?: string },
    performedBy: string
) => {
    const client = await Client.findById(clientId);
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

export const getClientBookingsService = async (clientId: string) => {
    await getClientByIdService(clientId);
    const bookings = await Booking.find({
        $or: [{ client: new mongoose.Types.ObjectId(clientId) }, { clientId: new mongoose.Types.ObjectId(clientId) }],
    }).sort({ createdAt: -1 });
    return bookings;
};

export const getClientPaymentsService = async (clientId: string) => {
    await getClientByIdService(clientId);
    const payments = await Payment.find({
        $or: [{ client: new mongoose.Types.ObjectId(clientId) }, { clientId: new mongoose.Types.ObjectId(clientId) }],
    }).sort({ createdAt: -1 });
    return payments;
};

export const importClientsService = async (buffer: Buffer, uploaderId: string, adminOverrideAgentId?: string) =>
    importClients(buffer, uploaderId, adminOverrideAgentId);

export const exportClientsService = async (filters: {
    agentId?: string;
    startDate?: string;
    endDate?: string;
}): Promise<ExcelJS.Buffer> => exportClients(filters);
