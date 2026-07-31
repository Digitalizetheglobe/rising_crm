import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth.middleware';
import {
    createLeadService,
    getAllLeadsService,
    getLeadByIdService,
    updateLeadService,
    updateLeadStatusService,
    assignLeadService,
    deleteLeadService,
    getLeadStatsService,
    getLeadActivityService,
} from './lead.service';
import { LeadStatus } from './lead.constants';

// POST /api/v1/leads
export const createLead = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const lead = await createLeadService(req.body, req.user!.UserId, req.user!.tenantId!);
        res.status(201).json({ success: true, message: 'Lead created successfully', data: lead });
    } catch (error: any) {
        res.status(400).json({ success: false, message: error.message });
    }
};

// GET /api/v1/leads
export const getAllLeads = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const page  = parseInt(req.query.page  as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;

        const queryParams = { ...req.query } as Record<string, any>;

        // SALES_EXECUTIVE sees only their own leads
        if (req.user!.role === 'SALES_EXECUTIVE') {
            queryParams.assignedTo = req.user!.UserId;
        }

        const result = await getAllLeadsService(queryParams, page, limit, req.user!.tenantId!);
        res.status(200).json({ success: true, data: result });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// GET /api/v1/leads/stats
export const getLeadStats = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const filters = { ...req.query } as Record<string, any>;

        // Executive can only see their own stats
        if (req.user!.role === 'SALES_EXECUTIVE') {
            filters.assignedTo = req.user!.UserId;
        }

        const stats = await getLeadStatsService(filters, req.user!.tenantId!);
        res.status(200).json({ success: true, data: stats });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// GET /api/v1/leads/:id
export const getLeadById = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const lead = await getLeadByIdService(req.params.id as string, req.user!.tenantId!);
        res.status(200).json({ success: true, data: lead });
    } catch (error: any) {
        const code = error.statusCode || 500;
        res.status(code).json({ success: false, message: error.message });
    }
};

// GET /api/v1/leads/:id/activity
export const getLeadActivity = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const lead = await getLeadActivityService(req.params.id as string, req.user!.tenantId!);
        res.status(200).json({ success: true, data: lead });
    } catch (error: any) {
        const code = error.statusCode || 500;
        res.status(code).json({ success: false, message: error.message });
    }
};

// PUT /api/v1/leads/:id
export const updateLead = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const updated = await updateLeadService(req.params.id as string, req.body, req.user!.UserId, req.user!.tenantId!);
        res.status(200).json({ success: true, message: 'Lead updated successfully', data: updated });
    } catch (error: any) {
        const code = error.statusCode || 400;
        res.status(code).json({ success: false, message: error.message });
    }
};

// PATCH /api/v1/leads/:id/status
export const updateLeadStatus = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { status, notes, lostReason, duplicateOfLead } = req.body;
        const updated = await updateLeadStatusService(
            req.params.id as string,
            status as LeadStatus,
            req.user!.UserId,
            req.user!.tenantId!,
            notes,
            lostReason,
            duplicateOfLead
        );
        res.status(200).json({ success: true, message: `Lead status updated to ${status}`, data: updated });
    } catch (error: any) {
        const code = error.statusCode || 400;
        res.status(code).json({ success: false, message: error.message });
    }
};

// PATCH /api/v1/leads/:id/assign
export const assignLead = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { assignedTo, reason } = req.body;
        const updated = await assignLeadService(
            req.params.id as string,
            assignedTo,
            req.user!.UserId,
            req.user!.tenantId!,
            reason
        );
        res.status(200).json({ success: true, message: 'Lead assigned successfully', data: updated });
    } catch (error: any) {
        const code = error.statusCode || 400;
        res.status(code).json({ success: false, message: error.message });
    }
};

// DELETE /api/v1/leads/:id
export const deleteLead = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const result = await deleteLeadService(req.params.id as string, req.user!.tenantId!);
        res.status(200).json({ success: true, message: result.message });
    } catch (error: any) {
        const code = error.statusCode || 400;
        res.status(code).json({ success: false, message: error.message });
    }
};