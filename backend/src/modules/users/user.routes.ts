import { Router } from 'express';
import { protect } from '../../middleware/auth.middleware';
import { allowRoles } from '../../middleware/role.middleware';
import { validate } from '../../middleware/validate.middleware';
import { createUserSchema, updateUserSchema } from './user.validation';
import * as userController from './user.controller';

const router = Router();

// All user routes should be protected and only accessible by ADMIN or SUPER_ADMIN
router.use(protect);
router.use(allowRoles('ADMIN', 'SUPER_ADMIN'));

router.route('/')
    .get(userController.getUsers)
    .post(validate(createUserSchema), userController.createUser);

router.route('/:id')
    .get(userController.getUser)
    .put(validate(updateUserSchema), userController.updateUser)
    .delete(userController.deleteUser);

export default router;
