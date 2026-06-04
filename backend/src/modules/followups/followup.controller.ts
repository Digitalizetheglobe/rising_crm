import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth.middleware';
import {
    createFollowUpService,
    getAllFollowUpsService,
    getFollowUpByIdService,
    updateFollowUpService,
    completeFollowUpService,
    rescheduleFollowUpService,
    cancelFollowUpService,
    getFollowUpStatsService,
} from './followup.service';

// POST /api/v1/followups
export const createFollowUp = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const followUp = await createFollowUpService(req.body, req.user!.UserId);
        res.status(201).json({ success: true, message: 'Follow-up scheduled successfully', data: followUp });
    } catch (error: any) {
        const code = error.statusCode || 400;
        res.status(code).json({ success: false, message: error.message });
    }
};

// GET /api/v1/followups
export const getAllFollowUps = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const page  = parseInt(req.query.page  as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;

        const queryParams = { ...req.query } as Record<string, any>;

        // SALES_EXECUTIVE sees only their own
        if (req.user!.role === 'SALES_EXECUTIVE') {
            queryParams.assignedTo = req.user!.UserId;
        }

        const result = await getAllFollowUpsService(queryParams, page, limit);
        res.status(200).json({ success: true, data: result });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// GET /api/v1/followups/stats
export const getFollowUpStats = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const filters = { ...req.query } as Record<string, any>;
        if (req.user!.role === 'SALES_EXECUTIVE') {
            filters.assignedTo = req.user!.UserId;
        }
        const stats = await getFollowUpStatsService(filters);
        res.status(200).json({ success: true, data: stats });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// GET /api/v1/followups/:id
export const getFollowUpById = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const followUp = await getFollowUpByIdService(req.params.id as string);
        res.status(200).json({ success: true, data: followUp });
    } catch (error: any) {
        const code = error.statusCode || 500;
        res.status(code).json({ success: false, message: error.message });
    }
};

// PUT /api/v1/followups/:id
export const updateFollowUp = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const updated = await updateFollowUpService(req.params.id as string, req.body);
        res.status(200).json({ success: true, message: 'Follow-up updated successfully', data: updated });
    } catch (error: any) {
        const code = error.statusCode || 400;
        res.status(code).json({ success: false, message: error.message });
    }
};

// PATCH /api/v1/followups/:id/complete
export const completeFollowUp = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { outcome, notes, nextFollowUp } = req.body;
        const result = await completeFollowUpService(
            req.params.id as string,
            outcome,
            notes,
            req.user!.UserId,
            nextFollowUp
        );
        res.status(200).json({ success: true, message: result.message, data: result });
    } catch (error: any) {
        const code = error.statusCode || 400;
        res.status(code).json({ success: false, message: error.message });
    }
};

// PATCH /api/v1/followups/:id/reschedule
export const rescheduleFollowUp = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { scheduledAt, rescheduleReason, notes } = req.body;
        const result = await rescheduleFollowUpService(
            req.params.id as string,
            new Date(scheduledAt),
            rescheduleReason,
            req.user!.UserId,
            notes
        );
        res.status(200).json({ success: true, message: result.message, data: result });
    } catch (error: any) {
        const code = error.statusCode || 400;
        res.status(code).json({ success: false, message: error.message });
    }
};

// PATCH /api/v1/followups/:id/cancel
export const cancelFollowUp = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { reason } = req.body;
        const result = await cancelFollowUpService(req.params.id as string, req.user!.UserId, reason);
        res.status(200).json({ success: true, message: result.message });
    } catch (error: any) {
        const code = error.statusCode || 400;
        res.status(code).json({ success: false, message: error.message });
    }
};