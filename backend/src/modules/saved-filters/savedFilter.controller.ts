import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth.middleware';
import SavedFilter from './savedFilter.model';

export const saveFilterState = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { gridId, filterState } = req.body;
        const userId = req.user?.UserId;
        const tenantId = req.user?.tenantId;

        if (!gridId || !filterState) {
            res.status(400).json({ success: false, message: 'gridId and filterState are required' });
            return;
        }

        if (!userId || !tenantId) {
            res.status(401).json({ success: false, message: 'User or tenant session missing' });
            return;
        }

        // Upsert the filter state
        const [savedFilter, created] = await SavedFilter.upsert({
            tenantId,
            userId,
            gridId,
            filterState,
        } as any);

        res.status(200).json({
            success: true,
            message: created ? 'Filter state created' : 'Filter state updated',
            data: savedFilter,
        });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message || 'Internal server error' });
    }
};

export const getFilterState = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { gridId } = req.params;
        const userId = req.user?.UserId;
        const tenantId = req.user?.tenantId;

        if (!userId || !tenantId) {
            res.status(401).json({ success: false, message: 'User or tenant session missing' });
            return;
        }

        const savedFilter = await SavedFilter.findOne({
            where: {
                tenantId,
                userId,
                gridId,
            },
        });

        if (!savedFilter) {
            res.status(404).json({ success: false, message: 'Saved filter not found' });
            return;
        }

        res.status(200).json({
            success: true,
            data: savedFilter,
        });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message || 'Internal server error' });
    }
};
