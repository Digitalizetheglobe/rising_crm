import { Router } from 'express';
import { protect } from '../../middleware/auth.middleware';
import { allowRoles } from '../../middleware/role.middleware';
import { validate } from '../../middleware/validate.middleware';
import { createUserSchema, updateUserSchema } from './user.validation';
import * as userController from './user.controller';

const router = Router();

// Fetching users is allowed for SALES_MANAGER to assign leads
router.use(protect);

router.route('/')
    .get(allowRoles('ADMIN', 'SUPER_ADMIN', 'SALES_MANAGER', 'SALES_EXECUTIVE', 'FINANCIAL_EXECUTIVE', 'FINANCE_MANAGER', 'VIEWER'), userController.getUsers)
    .post(allowRoles('ADMIN', 'SUPER_ADMIN'), validate(createUserSchema), userController.createUser);

router.route('/:id')
    .get(allowRoles('ADMIN', 'SUPER_ADMIN', 'SALES_MANAGER', 'SALES_EXECUTIVE', 'FINANCIAL_EXECUTIVE', 'FINANCE_MANAGER', 'VIEWER'), userController.getUser)
    .put(allowRoles('ADMIN', 'SUPER_ADMIN'), validate(updateUserSchema), userController.updateUser)
    .delete(allowRoles('ADMIN', 'SUPER_ADMIN'), userController.deleteUser);

export default router;
