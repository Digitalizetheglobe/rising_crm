
import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth.middleware';
import {
    createProjectService,
    deleteProjectService,
    getAllProjectsService,
    getProjectByIdService,
    getProjectStatsService,
    getProjectUnitsService,
    updateProjectImagesService,
    updateProjectService,
} from './project.service';

export const createProject = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const project = await createProjectService(req.body, req.user!.UserId);
        res.status(201).json({ success: true, message: 'Project created successfully', data: project });
    } catch (error: any) {
        const code = error.statusCode || 400;
        res.status(code).json({ success: false, message: error.message });
    }
};

export const getAllProjects = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const page   = parseInt(req.query.page  as string, 10) || 1;
        const limit  = parseInt(req.query.limit as string, 10) || 10;
        const result = await getAllProjectsService(req.query as Record<string, any>, page, limit);
        res.status(200).json({ success: true, data: result });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getProjectById = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const project = await getProjectByIdService(req.params.id as string);
        res.status(200).json({ success: true, data: project });
    } catch (error: any) {
        const code = error.statusCode || 500;
        res.status(code).json({ success: false, message: error.message });
    }
};

export const updateProject = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const project = await updateProjectService(req.params.id as string, req.body);
        res.status(200).json({ success: true, message: 'Project updated successfully', data: project });
    } catch (error: any) {
        const code = error.statusCode || 400;
        res.status(code).json({ success: false, message: error.message });
    }
};

export const deleteProject = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const result = await deleteProjectService(req.params.id as string);
        res.status(200).json({ success: true, message: result.message });
    } catch (error: any) {
        const code = error.statusCode || 400;
        res.status(code).json({ success: false, message: error.message });
    }
};

export const getProjectUnits = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const units = await getProjectUnitsService(req.params.id as string);
        res.status(200).json({ success: true, data: units });
    } catch (error: any) {
        const code = error.statusCode || 500;
        res.status(code).json({ success: false, message: error.message });
    }
};

export const getProjectStats = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const stats = await getProjectStatsService(req.params.id as string);
        res.status(200).json({ success: true, data: stats });
    } catch (error: any) {
        const code = error.statusCode || 500;
        res.status(code).json({ success: false, message: error.message });
    }
};

export const updateProjectImages = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { images = [], brochure } = req.body;
        const project = await updateProjectImagesService(req.params.id as string, images, brochure);
        res.status(200).json({ success: true, message: 'Project media updated successfully', data: project });
    } catch (error: any) {
        const code = error.statusCode || 400;
        res.status(code).json({ success: false, message: error.message });
    }
};