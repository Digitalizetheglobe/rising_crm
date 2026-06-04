import ExcelJS from 'exceljs';
import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth.middleware';
import { ApiError } from '../../utils/ApiError';
import {
    createClientService,
    deleteClientService,
    exportClientsService,
    getAllClientsService,
    getClientBookingsService,
    getClientByIdService,
    getClientPaymentsService,
    importClientsService,
    updateClientService,
    uploadClientDocumentsService,
} from './client.service';

const sendExcel = (res: Response, buffer: ExcelJS.Buffer, filename: string) => {
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}_${Date.now()}.xlsx"`);
    res.send(buffer);
};

export const createClient = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const client = await createClientService(req.body, req.user!.UserId);
        res.status(201).json({ success: true, message: 'Client created successfully', data: client });
    } catch (error: any) {
        const code = error.statusCode || 400;
        res.status(code).json({ success: false, message: error.message });
    }
};

export const getAllClients = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const page = parseInt(req.query.page as string, 10) || 1;
        const limit = parseInt(req.query.limit as string, 10) || 10;
        const queryParams = { ...req.query } as Record<string, any>;

        if (req.user!.role === 'SALES_EXECUTIVE') {
            queryParams.assignedTo = req.user!.UserId;
        }

        const result = await getAllClientsService(queryParams, page, limit);
        res.status(200).json({ success: true, data: result });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getClientById = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const client = await getClientByIdService(req.params.id as string);
        res.status(200).json({ success: true, data: client });
    } catch (error: any) {
        const code = error.statusCode || 500;
        res.status(code).json({ success: false, message: error.message });
    }
};

export const updateClient = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const client = await updateClientService(req.params.id as string, req.body, req.user!.UserId);
        res.status(200).json({ success: true, message: 'Client updated successfully', data: client });
    } catch (error: any) {
        const code = error.statusCode || 400;
        res.status(code).json({ success: false, message: error.message });
    }
};

export const deleteClient = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const result = await deleteClientService(req.params.id as string);
        res.status(200).json({ success: true, message: result.message });
    } catch (error: any) {
        const code = error.statusCode || 400;
        res.status(code).json({ success: false, message: error.message });
    }
};

export const uploadClientDocuments = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const client = await uploadClientDocumentsService(req.params.id as string, req.body, req.user!.UserId);
        res.status(200).json({ success: true, message: 'Client documents updated successfully', data: client });
    } catch (error: any) {
        const code = error.statusCode || 400;
        res.status(code).json({ success: false, message: error.message });
    }
};

export const getClientBookings = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const bookings = await getClientBookingsService(req.params.id as string);
        res.status(200).json({ success: true, data: bookings });
    } catch (error: any) {
        const code = error.statusCode || 500;
        res.status(code).json({ success: false, message: error.message });
    }
};

export const getClientPayments = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const payments = await getClientPaymentsService(req.params.id as string);
        res.status(200).json({ success: true, data: payments });
    } catch (error: any) {
        const code = error.statusCode || 500;
        res.status(code).json({ success: false, message: error.message });
    }
};

export const importClients = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        if (!req.file) throw new ApiError(400, 'Please upload an Excel or CSV file.');
        const result = await importClientsService(req.file.buffer, req.user!.UserId, req.body.agentId);
        res.status(200).json({ success: true, message: 'Clients import complete', data: result });
    } catch (error: any) {
        const code = error.statusCode || 400;
        res.status(code).json({ success: false, message: error.message });
    }
};

export const exportClients = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const buffer = await exportClientsService({
            agentId: req.query.agentId as string | undefined,
            startDate: req.query.startDate as string | undefined,
            endDate: req.query.endDate as string | undefined,
        });
        sendExcel(res, buffer, 'clients');
    } catch (error: any) {
        const code = error.statusCode || 500;
        res.status(code).json({ success: false, message: error.message });
    }
};
