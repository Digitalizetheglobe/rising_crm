import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middleware/auth.middleware';
import { siteVisitService } from './sitevisit.service';

export const createSiteVisit = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const data = {
            ...req.body,
            createdBy: req.user!.UserId,
        };
        const siteVisit = await siteVisitService.createSiteVisit(data);
        res.status(201).json({ success: true, data: siteVisit });
    } catch (error: any) {
        res.status(400).json({ success: false, message: error.message });
    }
};

export const getSiteVisits = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { page, limit, status, leadId, assignedTo } = req.query;
        const filter: any = {};
        
        if (status) filter.status = status;
        if (leadId) filter.lead = leadId;
        if (assignedTo) filter.assignedTo = assignedTo;

        // Role-based filtering
        if (req.user!.role === 'Executive') {
            filter.assignedTo = req.user!.UserId;
        }

        const result = await siteVisitService.getSiteVisits(filter, {
            page: page ? parseInt(page as string) : 1,
            limit: limit ? parseInt(limit as string) : 10,
        });

        res.status(200).json({ success: true, ...result });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getSiteVisitById = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const siteVisit = await siteVisitService.getSiteVisitById(req.params.id as string);
        if (!siteVisit) {
            res.status(404).json({ success: false, message: 'Site Visit not found' });
            return;
        }
        res.status(200).json({ success: true, data: siteVisit });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const updateSiteVisit = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        if (req.body.status === 'COMPLETED' && !req.body.completedAt) {
            req.body.completedAt = new Date();
        }
        const siteVisit = await siteVisitService.updateSiteVisit(req.params.id as string, req.body);
        if (!siteVisit) {
            res.status(404).json({ success: false, message: 'Site Visit not found' });
            return;
        }
        res.status(200).json({ success: true, data: siteVisit });
    } catch (error: any) {
        res.status(400).json({ success: false, message: error.message });
    }
};

export const deleteSiteVisit = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const success = await siteVisitService.deleteSiteVisit(req.params.id as string);
        if (!success) {
            res.status(404).json({ success: false, message: 'Site Visit not found' });
            return;
        }
        res.status(200).json({ success: true, message: 'Site Visit deleted successfully' });
    } catch (error: any) {
        res.status(400).json({ success: false, message: error.message });
    }
};
