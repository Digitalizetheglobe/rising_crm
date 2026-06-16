import { SiteVisit, ISiteVisit } from './sitevisit.model';
import mongoose from 'mongoose';

export class SiteVisitService {
    async createSiteVisit(data: Partial<ISiteVisit>): Promise<ISiteVisit> {
        const siteVisit = new SiteVisit(data);
        return await siteVisit.save();
    }

    async getSiteVisits(filter: any = {}, options: { page?: number; limit?: number; sort?: any } = {}) {
        const { page = 1, limit = 10, sort = { scheduledAt: -1 } } = options;
        const skip = (page - 1) * limit;

        const [siteVisits, total] = await Promise.all([
            SiteVisit.find(filter)
                .sort(sort)
                .skip(skip)
                .limit(limit)
                .populate('lead', 'name phone email status')
                .populate('project', 'name')
                .populate('assignedTo', 'name email')
                .populate('createdBy', 'name email'),
            SiteVisit.countDocuments(filter)
        ]);

        return {
            siteVisits,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        };
    }

    async getSiteVisitById(id: string): Promise<ISiteVisit | null> {
        return await SiteVisit.findById(id)
            .populate('lead', 'name phone email status')
            .populate('project', 'name')
            .populate('assignedTo', 'name email')
            .populate('createdBy', 'name email');
    }

    async updateSiteVisit(id: string, data: Partial<ISiteVisit>): Promise<ISiteVisit | null> {
        return await SiteVisit.findByIdAndUpdate(id, data, { new: true })
            .populate('lead', 'name phone email status')
            .populate('project', 'name')
            .populate('assignedTo', 'name email')
            .populate('createdBy', 'name email');
    }

    async deleteSiteVisit(id: string): Promise<boolean> {
        const result = await SiteVisit.findByIdAndDelete(id);
        return result !== null;
    }
}

export const siteVisitService = new SiteVisitService();
