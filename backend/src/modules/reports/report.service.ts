import Lead from '../leads/lead.model';
import Enquiry from '../enquiries/enquiry.model';
import sequelize from '../../config/sequelize';
import { Op } from 'sequelize';
import { getTenantId } from '../../middleware/tenant.middleware';

export const getLeadReportService = async (startDate?: Date, endDate?: Date) => {
    const tenantId = getTenantId();
    const whereClause: any = { tenantId };
    
    if (startDate || endDate) {
        whereClause.createdAt = {};
        if (startDate) whereClause.createdAt[Op.gte] = startDate;
        if (endDate) whereClause.createdAt[Op.lte] = endDate;
    }

    const [statusReport, sourceReport, priorityReport, totalLeads] = await Promise.all([
        Lead.findAll({
            where: whereClause,
            attributes: [
                'status',
                [sequelize.fn('COUNT', sequelize.col('id')), 'count']
            ],
            group: ['status']
        }),
        Lead.findAll({
            where: whereClause,
            attributes: [
                'source',
                [sequelize.fn('COUNT', sequelize.col('id')), 'count']
            ],
            group: ['source']
        }),
        Lead.findAll({
            where: whereClause,
            attributes: [
                'priority',
                [sequelize.fn('COUNT', sequelize.col('id')), 'count']
            ],
            group: ['priority']
        }),
        Lead.count({ where: whereClause })
    ]);

    return {
        totalLeads,
        byStatus: statusReport.map((item: any) => ({ status: item.status, count: parseInt(item.getDataValue('count') || '0', 10) })),
        bySource: sourceReport.map((item: any) => ({ source: item.source, count: parseInt(item.getDataValue('count') || '0', 10) })),
        byPriority: priorityReport.map((item: any) => ({ priority: item.priority, count: parseInt(item.getDataValue('count') || '0', 10) }))
    };
};
