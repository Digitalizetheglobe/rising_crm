import { Router } from 'express';
import { protect } from '../../middleware/auth.middleware';
import { allowRoles } from '../../middleware/role.middleware';
import { validate } from '../../middleware/validate.middleware';
import {
  verifyMetaWebhook,
  receiveMetaWebhook,
  getUnmatchedMetaLeads,
  markUnmatchedAsResolved,
} from './metaWebhook.controller';
import { resolveUnmatchedLeadSchema } from './metaWebhook.validation';

const router = Router();

router.get('/', verifyMetaWebhook);
router.post('/', receiveMetaWebhook);

router.use(protect);

router.get(
  '/unmatched',
  allowRoles('SUPER_ADMIN', 'ADMIN', 'SALES_MANAGER'),
  getUnmatchedMetaLeads
);

router.patch(
  '/unmatched/:id',
  allowRoles('SUPER_ADMIN', 'ADMIN', 'SALES_MANAGER'),
  validate(resolveUnmatchedLeadSchema),
  markUnmatchedAsResolved
);

export default router;
