import { Router } from 'express';
import multer from 'multer';
import { protect } from '../../middleware/auth.middleware';
import { allowRoles } from '../../middleware/role.middleware';
import { validate } from '../../middleware/validate.middleware';
import {
    createClient,
    deleteClient,
    exportClients,
    getAllClients,
    getClientBookings,
    getClientById,
    getClientPayments,
    importClients,
    updateClient,
    uploadClientDocuments,
} from './client.controller';
import { createClientSchema, updateClientSchema, uploadClientDocumentsSchema } from './client.validation';

const router = Router();
const memStorage = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 20 * 1024 * 1024 },
});

router.use(protect);

router.post(
    '/',
    allowRoles('SUPER_ADMIN', 'ADMIN', 'SALES_MANAGER', 'SALES_EXECUTIVE'),
    validate(createClientSchema),
    createClient
);
router.get('/', getAllClients);
router.get('/export', exportClients);
router.post('/import', allowRoles('SUPER_ADMIN', 'ADMIN', 'SALES_MANAGER'), memStorage.single('file'), importClients);

router.get('/:id', getClientById);
router.put(
    '/:id',
    allowRoles('SUPER_ADMIN', 'ADMIN', 'SALES_MANAGER', 'SALES_EXECUTIVE'),
    validate(updateClientSchema),
    updateClient
);
router.delete('/:id', allowRoles('SUPER_ADMIN', 'ADMIN'), deleteClient);
router.post(
    '/:id/documents',
    allowRoles('SUPER_ADMIN', 'ADMIN', 'SALES_MANAGER', 'SALES_EXECUTIVE'),
    validate(uploadClientDocumentsSchema),
    uploadClientDocuments
);
router.get('/:id/bookings', getClientBookings);
router.get('/:id/payments', getClientPayments);

export default router;
