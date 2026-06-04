import { Router } from 'express';
import { protect } from '../../middleware/auth.middleware';
import { upload } from '../../middleware/upload.middleware';
import { uploadSingleFile, uploadMultipleFiles } from './upload.controller';

const router = Router();

router.use(protect);

router.post('/single', upload.single('file'), uploadSingleFile);
router.post('/multiple', upload.array('files', 10), uploadMultipleFiles);

export default router;
