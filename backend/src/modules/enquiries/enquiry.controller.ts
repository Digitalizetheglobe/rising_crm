import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import {
    createEnquirySchema,
    updateEnquirySchema,
    updateStatusSchema,
    assignEnquirySchema,
    convertToLeadSchema,
} from './enquiry.validation';
import {
    createEnquiryService,
    getAllEnquiriesService,
    getEnquiryByIdService,
    updateEnquiryService,
    updateEnquiryStatusService,
    assignEnquiryService,
    convertToLeadService,
    deleteEnquiryService,
    getEnquiryStatsService,
} from './enquiry.service';

// POST /api/v1/enquiries
export const createEnquiry = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const enquiry = await createEnquiryService(req.body, req.user!.UserId);
        res.status(201).json({
            success: true,
            message: 'Enquiry created successfully',
            data: enquiry,
        });
    } catch (error: any) {
        res.status(400).json({ success: false, message: error.message });
    }
};

// GET /api/v1/enquiries
export const getAllEnquiries = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const page  = parseInt(req.query.page as string)  || 1;
        const limit = parseInt(req.query.limit as string) || 10;

        // SALES_EXECUTIVE can only see their own assigned enquiries
        const queryParams = { ...req.query } as Record<string, any>;
        if (req.user!.role === 'SALES_EXECUTIVE') {
            queryParams.assignedTo = req.user!.UserId;
        }

        const result = await getAllEnquiriesService(queryParams, page, limit);
        res.status(200).json({ success: true, data: result });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// GET /api/v1/enquiries/stats
export const getEnquiryStats = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const stats = await getEnquiryStatsService();
        res.status(200).json({ success: true, data: stats });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// GET /api/v1/enquiries/:id
export const getEnquiryById = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const enquiry = await getEnquiryByIdService(req.params.id as string);
        res.status(200).json({ success: true, data: enquiry });
    } catch (error: any) {
        const status = error.statusCode || 500;
        res.status(status).json({ success: false, message: error.message });
    }
};

// PUT /api/v1/enquiries/:id
export const updateEnquiry = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const updated = await updateEnquiryService(req.params.id as string, req.body);
        res.status(200).json({
            success: true,
            message: 'Enquiry updated successfully',
            data: updated,
        });
    } catch (error: any) {
        const status = error.statusCode || 400;
        res.status(status).json({ success: false, message: error.message });
    }
};

// PATCH /api/v1/enquiries/:id/status
export const updateEnquiryStatus = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { status, notes, rejectionReason } = req.body;
        const updated = await updateEnquiryStatusService(
            req.params.id as string,
            status,
            req.user!.UserId,
            notes,
            rejectionReason
        );
        res.status(200).json({
            success: true,
            message: `Enquiry status updated to ${status}`,
            data: updated,
        });
    } catch (error: any) {
        const code = error.statusCode || 400;
        res.status(code).json({ success: false, message: error.message });
    }
};

// PATCH /api/v1/enquiries/:id/assign
export const assignEnquiry = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { assignedTo } = req.body;
        const updated = await assignEnquiryService(
            req.params.id as string,
            assignedTo,
            req.user!.UserId
        );
        res.status(200).json({
            success: true,
            message: 'Enquiry assigned successfully',
            data: updated,
        });
    } catch (error: any) {
        const code = error.statusCode || 400;
        res.status(code).json({ success: false, message: error.message });
    }
};

// POST /api/v1/enquiries/:id/convert
export const convertToLead = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { assignedTo, followUpDate, followUpNotes, priority } = req.body;
        const result = await convertToLeadService(
            req.params.id as string,
            req.user!.UserId,
            assignedTo,
            new Date(followUpDate),
            followUpNotes,
            priority
        );
        res.status(201).json({
            success: true,
            message: result.message,
            data: result.lead,
        });
    } catch (error: any) {
        const code = error.statusCode || 400;
        res.status(code).json({ success: false, message: error.message });
    }
};

// DELETE /api/v1/enquiries/:id
export const deleteEnquiry = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const result = await deleteEnquiryService(req.params.id as string);
        res.status(200).json({ success: true, message: result.message });
    } catch (error: any) {
        const code = error.statusCode || 400;
        res.status(code).json({ success: false, message: error.message });
    }
};