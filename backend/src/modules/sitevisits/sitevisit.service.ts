import { Op } from 'sequelize';
import SiteVisit, { SiteVisitAttributes, SiteVisitCreationAttributes } from './sitevisit.model';
import Lead from '../leads/lead.model';
import Project from '../projects/project.model';
import User from '../auth/auth.model';
import { getTenantId } from '../../middleware/tenant.middleware';
import { ApiError } from '../../utils/ApiError';

export class SiteVisitService {
  async createSiteVisit(data: Partial<SiteVisitCreationAttributes>): Promise<SiteVisit> {
    const tenantId = getTenantId();
    const siteVisit = await SiteVisit.create({
      ...data,
      tenantId,
    } as any);
    
    return await SiteVisit.findByPk(siteVisit.id, {
      include: [
        { model: Lead, as: 'lead', attributes: ['name', 'phone', 'email', 'status'] },
        { model: Project, as: 'project', attributes: ['name'] },
        { model: User, as: 'assignedUser', attributes: ['name', 'email'] },
        { model: User, as: 'createdByUser', attributes: ['name', 'email'] },
      ],
    }) as SiteVisit;
  }

  async getSiteVisits(filter: any = {}, options: { page?: number; limit?: number; sort?: any } = {}) {
    const tenantId = getTenantId();
    const { page = 1, limit = 10 } = options;
    const offset = (page - 1) * limit;

    const where: any = { ...filter, tenantId };
    
    if (where.lead) {
      where.leadId = where.lead;
      delete where.lead;
    }
    if (where.assignedTo) {
      where.assignedTo = where.assignedTo;
    }

    const { rows, count } = await SiteVisit.findAndCountAll({
      where,
      include: [
        { model: Lead, as: 'lead', attributes: ['name', 'phone', 'email', 'status'] },
        { model: Project, as: 'project', attributes: ['name'] },
        { model: User, as: 'assignedUser', attributes: ['name', 'email'] },
        { model: User, as: 'createdByUser', attributes: ['name', 'email'] },
      ],
      order: [['scheduledAt', 'DESC']],
      limit,
      offset,
    });

    return {
      siteVisits: rows,
      pagination: {
        total: count,
        page,
        limit,
        totalPages: Math.ceil(count / limit)
      }
    };
  }

  async getSiteVisitById(id: string): Promise<SiteVisit | null> {
    const tenantId = getTenantId();
    const siteVisit = await SiteVisit.findOne({
      where: { id, tenantId },
      include: [
        { model: Lead, as: 'lead', attributes: ['name', 'phone', 'email', 'status'] },
        { model: Project, as: 'project', attributes: ['name'] },
        { model: User, as: 'assignedUser', attributes: ['name', 'email'] },
        { model: User, as: 'createdByUser', attributes: ['name', 'email'] },
      ],
    });

    if (!siteVisit) throw new ApiError(404, 'Site Visit not found');
    return siteVisit;
  }

  async updateSiteVisit(id: string, data: Partial<SiteVisitAttributes>): Promise<SiteVisit | null> {
    const tenantId = getTenantId();
    const siteVisit = await SiteVisit.findOne({ where: { id, tenantId } });
    if (!siteVisit) throw new ApiError(404, 'Site Visit not found');

    await siteVisit.update(data);

    return await SiteVisit.findByPk(id, {
      include: [
        { model: Lead, as: 'lead', attributes: ['name', 'phone', 'email', 'status'] },
        { model: Project, as: 'project', attributes: ['name'] },
        { model: User, as: 'assignedUser', attributes: ['name', 'email'] },
        { model: User, as: 'createdByUser', attributes: ['name', 'email'] },
      ],
    });
  }

  async deleteSiteVisit(id: string): Promise<boolean> {
    const tenantId = getTenantId();
    const siteVisit = await SiteVisit.findOne({ where: { id, tenantId } });
    if (!siteVisit) throw new ApiError(404, 'Site Visit not found');

    await siteVisit.destroy();
    return true;
  }
}

export const siteVisitService = new SiteVisitService();
