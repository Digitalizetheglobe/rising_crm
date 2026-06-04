import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth.middleware';
import {
    createFeedbackService,
    deleteFeedbackService,
    getAllFeedbacksService,
    getFeedbackByIdService,
    getFeedbacksByClientService,
    getFeedbackStatsService,
    resolveFeedbackService,
    updateFeedbackService,
} from './feedback.service';

export const createFeedback = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const feedback = await createFeedbackService(req.body, req.user!.UserId);
        res.status(201).json({ success: true, message: 'Feedback logged successfully', data: feedback });
    } catch (error: any) {
        const code = error.statusCode || 400;
        res.status(code).json({ success: false, message: error.message });
    }
};

export const getAllFeedbacks = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const page  = parseInt(req.query.page  as string, 10) || 1;
        const limit = parseInt(req.query.limit as string, 10) || 10;
        const queryParams = { ...req.query } as Record<string, any>;

        if (req.user!.role === 'SALES_EXECUTIVE') {
            queryParams.loggedBy = req.user!.UserId;
        }

        const result = await getAllFeedbacksService(queryParams, page, limit);
        res.status(200).json({ success: true, data: result });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getFeedbackById = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const feedback = await getFeedbackByIdService(req.params.id as string);
        res.status(200).json({ success: true, data: feedback });
    } catch (error: any) {
        const code = error.statusCode || 500;
        res.status(code).json({ success: false, message: error.message });
    }
};

export const updateFeedback = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const feedback = await updateFeedbackService(req.params.id as string, req.body, req.user!.UserId);
        res.status(200).json({ success: true, message: 'Feedback updated successfully', data: feedback });
    } catch (error: any) {
        const code = error.statusCode || 400;
        res.status(code).json({ success: false, message: error.message });
    }
};

export const resolveFeedback = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const feedback = await resolveFeedbackService(req.params.id as string, req.body.resolvedNote, req.user!.UserId);
        res.status(200).json({ success: true, message: 'Feedback resolved successfully', data: feedback });
    } catch (error: any) {
        const code = error.statusCode || 400;
        res.status(code).json({ success: false, message: error.message });
    }
};

export const deleteFeedback = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const result = await deleteFeedbackService(req.params.id as string);
        res.status(200).json({ success: true, message: result.message });
    } catch (error: any) {
        const code = error.statusCode || 400;
        res.status(code).json({ success: false, message: error.message });
    }
};

export const getFeedbacksByClient = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const page  = parseInt(req.query.page  as string, 10) || 1;
        const limit = parseInt(req.query.limit as string, 10) || 10;
        const result = await getFeedbacksByClientService(req.params.clientId as string, page, limit);
        res.status(200).json({ success: true, data: result });
    } catch (error: any) {
        const code = error.statusCode || 500;
        res.status(code).json({ success: false, message: error.message });
    }
};

export const getFeedbackStats = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const filters = { ...req.query } as Record<string, any>;

        if (req.user!.role === 'SALES_EXECUTIVE') {
            filters.loggedBy = req.user!.UserId;
        }

        const stats = await getFeedbackStatsService(filters);
        res.status(200).json({ success: true, data: stats });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};