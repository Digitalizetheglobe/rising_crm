import { Router } from 'express';
import { protect } from '../../middleware/auth.middleware';
import { saveFilterState, getFilterState } from './savedFilter.controller';

const router = Router();

router.use(protect);

router.post('/', saveFilterState);
router.get('/:gridId', getFilterState);

export default router;
