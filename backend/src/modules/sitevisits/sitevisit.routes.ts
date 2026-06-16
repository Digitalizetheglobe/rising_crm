import { Router } from 'express';
import { protect } from '../../middleware/auth.middleware';
import { allowRoles } from '../../middleware/role.middleware';
import {
    createSiteVisit,
    getSiteVisits,
    getSiteVisitById,
    updateSiteVisit,
    deleteSiteVisit
} from './sitevisit.controller';

const router = Router();

// All site visit routes require authentication
router.use(protect);

router.route('/')
    .get(getSiteVisits)
    .post(createSiteVisit);

router.route('/:id')
    .get(getSiteVisitById)
    .put(updateSiteVisit)
    .delete(allowRoles('SUPER_ADMIN', 'ADMIN', 'SALES_MANAGER'), deleteSiteVisit);

export default router;
