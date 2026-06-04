import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth.middleware';
import {
    createCallService,
    deleteCallService,
    getAllCallsService,
    getCallByIdService,
    getCallsByClientService,
    getCallStatsService,
    updateCallService,
} from './call.service';

export const createCall = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const call = await createCallService(req.body, req.user!.UserId);
        res.status(201).json({ success: true, message: 'Call logged successfully', data: call });
    } catch (error: any) {
        const code = error.statusCode || 400;
        res.status(code).json({ success: false, message: error.message });
    }
};

export const getAllCalls = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const page  = parseInt(req.query.page  as string, 10) || 1;
        const limit = parseInt(req.query.limit as string, 10) || 10;
        const queryParams = { ...req.query } as Record<string, any>;

        // Sales executives can only see their own call logs
        if (req.user!.role === 'SALES_EXECUTIVE') {
            queryParams.loggedBy = req.user!.UserId;
        }

        const result = await getAllCallsService(queryParams, page, limit);
        res.status(200).json({ success: true, data: result });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getCallById = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const call = await getCallByIdService(req.params.id as string);
        res.status(200).json({ success: true, data: call });
    } catch (error: any) {
        const code = error.statusCode || 500;
        res.status(code).json({ success: false, message: error.message });
    }
};

export const updateCall = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const call = await updateCallService(req.params.id as string, req.body, req.user!.UserId);
        res.status(200).json({ success: true, message: 'Call log updated successfully', data: call });
    } catch (error: any) {
        const code = error.statusCode || 400;
        res.status(code).json({ success: false, message: error.message });
    }
};

export const deleteCall = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const result = await deleteCallService(req.params.id as string);
        res.status(200).json({ success: true, message: result.message });
    } catch (error: any) {
        const code = error.statusCode || 400;
        res.status(code).json({ success: false, message: error.message });
    }
};

export const getCallsByClient = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const page  = parseInt(req.query.page  as string, 10) || 1;
        const limit = parseInt(req.query.limit as string, 10) || 10;
        const result = await getCallsByClientService(req.params.clientId as string, page, limit);
        res.status(200).json({ success: true, data: result });
    } catch (error: any) {
        const code = error.statusCode || 500;
        res.status(code).json({ success: false, message: error.message });
    }
};

export const getCallStats = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const filters = { ...req.query } as Record<string, any>;

        // Sales executives only see their own stats
        if (req.user!.role === 'SALES_EXECUTIVE') {
            filters.loggedBy = req.user!.UserId;
        }

        const stats = await getCallStatsService(filters);
        res.status(200).json({ success: true, data: stats });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};