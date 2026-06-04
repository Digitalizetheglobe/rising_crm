
import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth.middleware';
import {
  createUnitService,
  bulkCreateUnitsService,
  getUnitsService,
  getUnitByIdService,
  updateUnitService,
  updateUnitStatusService,
  deleteUnitService,
  getUnitStatsService,
} from './unit.service';

// POST /api/v1/units
export const createUnit = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const unit = await createUnitService(req.body);
    res.status(201).json({ success: true, message: 'Unit created successfully', data: unit });
  } catch (error: any) {
    const code = error.statusCode || 500;
    res.status(code).json({ success: false, message: error.message });
  }
};

// POST /api/v1/units/bulk
export const bulkCreateUnits = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await bulkCreateUnitsService(req.body);
    res.status(201).json({
      success: true,
      message: `${result.insertedCount} unit(s) created${result.skippedCount > 0 ? `, ${result.skippedCount} skipped` : ''}`,
      data: result,
    });
  } catch (error: any) {
    const code = error.statusCode || 500;
    res.status(code).json({ success: false, message: error.message });
  }
};

// GET /api/v1/units
export const getUnits = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await getUnitsService(req.query as any);
    res.status(200).json({ success: true, message: 'Units fetched successfully', data: result });
  } catch (error: any) {
    const code = error.statusCode || 500;
    res.status(code).json({ success: false, message: error.message });
  }
};

// GET /api/v1/units/stats
export const getUnitStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { projectId } = req.query as { projectId?: string };
    const stats = await getUnitStatsService(projectId);
    res.status(200).json({ success: true, message: 'Unit stats fetched successfully', data: stats });
  } catch (error: any) {
    const code = error.statusCode || 500;
    res.status(code).json({ success: false, message: error.message });
  }
};

// GET /api/v1/units/:id
export const getUnitById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const unit = await getUnitByIdService(req.params.id as string);
    res.status(200).json({ success: true, message: 'Unit fetched successfully', data: unit });
  } catch (error: any) {
    const code = error.statusCode || 500;
    res.status(code).json({ success: false, message: error.message });
  }
};

// PUT /api/v1/units/:id
export const updateUnit = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const unit = await updateUnitService(req.params.id as string, req.body);
    res.status(200).json({ success: true, message: 'Unit updated successfully', data: unit });
  } catch (error: any) {
    const code = error.statusCode || 500;
    res.status(code).json({ success: false, message: error.message });
  }
};

// PATCH /api/v1/units/:id/status
export const updateUnitStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const unit = await updateUnitStatusService(req.params.id as string, req.body.status);
    res.status(200).json({ success: true, message: 'Unit status updated successfully', data: unit });
  } catch (error: any) {
    const code = error.statusCode || 500;
    res.status(code).json({ success: false, message: error.message });
  }
};

// DELETE /api/v1/units/:id
export const deleteUnit = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await deleteUnitService(req.params.id as string);
    res.status(200).json({ success: true, message: 'Unit deleted successfully', data: result });
  } catch (error: any) {
    const code = error.statusCode || 500;
    res.status(code).json({ success: false, message: error.message });
  }
};