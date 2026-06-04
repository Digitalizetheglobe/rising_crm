import { Router } from 'express';
import { protect } from '../../middleware/auth.middleware';
import { allowRoles } from '../../middleware/role.middleware';
import { getLeadReport } from './report.controller';

const router = Router();

router.use(protect);
router.use(allowRoles('SUPER_ADMIN', 'ADMIN', 'SALES_MANAGER'));

router.get('/leads', getLeadReport);

export default router;
