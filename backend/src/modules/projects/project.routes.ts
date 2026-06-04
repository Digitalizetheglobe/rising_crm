
import { Router } from 'express';
import { protect } from '../../middleware/auth.middleware';
import { allowRoles } from '../../middleware/role.middleware';
import { validate } from '../../middleware/validate.middleware';
import {
    createProject,
    deleteProject,
    getAllProjects,
    getProjectById,
    getProjectStats,
    getProjectUnits,
    updateProject,
    updateProjectImages,
} from './project.controller';
import { createProjectSchema, updateProjectImagesSchema, updateProjectSchema } from './project.validation';

const router = Router();

router.use(protect);

// All roles can browse projects and their units
router.get('/',        getAllProjects);
router.get('/:id',     getProjectById);
router.get('/:id/units',  getProjectUnits);
router.get('/:id/stats',  getProjectStats);

// Create / edit — Admin and Manager only
router.post(
    '/',
    allowRoles('SUPER_ADMIN', 'ADMIN', 'SALES_MANAGER'),
    validate(createProjectSchema),
    createProject
);

router.put(
    '/:id',
    allowRoles('SUPER_ADMIN', 'ADMIN', 'SALES_MANAGER'),
    validate(updateProjectSchema),
    updateProject
);

// Media update — separate endpoint to keep main update clean
router.patch(
    '/:id/images',
    allowRoles('SUPER_ADMIN', 'ADMIN', 'SALES_MANAGER'),
    validate(updateProjectImagesSchema),
    updateProjectImages
);

// Delete — Admin only, blocked if units exist
router.delete(
    '/:id',
    allowRoles('SUPER_ADMIN', 'ADMIN'),
    deleteProject
);

export default router;