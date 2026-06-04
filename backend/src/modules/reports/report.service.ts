import { Lead } from '../leads/lead.model';
import { Enquiry } from '../enquiries/enquiry.model';

export const getLeadReportService = async (startDate?: Date, endDate?: Date) => {
    const matchStage: any = {};
    if (startDate || endDate) {
        matchStage.createdAt = {};
        if (startDate) matchStage.createdAt.$gte = startDate;
        if (endDate) matchStage.createdAt.$lte = endDate;
    }

    const [statusReport, sourceReport, priorityReport, totalLeads] = await Promise.all([
        Lead.aggregate([
            { $match: matchStage },
            { $group: { _id: '$status', count: { $sum: 1 } } }
        ]),
        Lead.aggregate([
            { $match: matchStage },
            { $group: { _id: '$source', count: { $sum: 1 } } }
        ]),
        Lead.aggregate([
            { $match: matchStage },
            { $group: { _id: '$priority', count: { $sum: 1 } } }
        ]),
        Lead.countDocuments(matchStage)
    ]);

    return {
        totalLeads,
        byStatus: statusReport.map(item => ({ status: item._id, count: item.count })),
        bySource: sourceReport.map(item => ({ source: item._id, count: item.count })),
        byPriority: priorityReport.map(item => ({ priority: item._id, count: item.count }))
    };
};
