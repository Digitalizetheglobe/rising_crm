import { Request, Response } from 'express';
import { getLeadReportService } from './report.service';

export const getLeadReport = async (req: Request, res: Response): Promise<void> => {
    try {
        const { startDate, endDate } = req.query;
        const start = startDate ? new Date(startDate as string) : undefined;
        const end = endDate ? new Date(endDate as string) : undefined;

        const data = await getLeadReportService(start, end);

        res.status(200).json({
            success: true,
            message: 'Lead report generated successfully',
            data
        });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};
