import { Router } from 'express';
import multer from 'multer';
import { protect } from '../../middleware/auth.middleware';
import { allowRoles } from '../../middleware/role.middleware';
import { ROLES } from '../../constants/roles';
import {
  handleImportLeads, handleImportClients, handleImportPayments,
  handleImportProjects, handleImportUnits,
  handleExportLeads, handleExportClients, handleExportPayments,
  handleExportProjects, handleExportUnits,
  handleDownloadTemplate, handleDownloadCrmTemplate,
} from './importExport.controller';

const router = Router();

// Store file in memory buffer — no disk write needed
const memStorage = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB max
  fileFilter: (_req, file, cb) => {
    const allowed = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-excel',   // .xls
      'text/csv',                   // .csv
    ];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only Excel (.xlsx, .xls) and CSV files are allowed.') as any, false);
    }
  },
});

router.use(protect);

// ── Templates (download blank Excel with correct headers) ─────────────────────
// GET /api/v1/data/template/:type   (type = leads | clients | payments | projects | units)
router.get('/template/:type', handleDownloadTemplate);

// GET /api/v1/data/crm-template
router.get('/crm-template', handleDownloadCrmTemplate);

// ── Imports (POST with file + optional agentId in body) ───────────────────────
// Admin and Manager only for all imports
router.post('/import/leads',    allowRoles(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.SALES_MANAGER), memStorage.single('file'), handleImportLeads);
router.post('/import/clients',  allowRoles(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.SALES_MANAGER), memStorage.single('file'), handleImportClients);
router.post('/import/payments', allowRoles(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.SALES_MANAGER), memStorage.single('file'), handleImportPayments);
router.post('/import/projects', allowRoles(ROLES.SUPER_ADMIN, ROLES.ADMIN),                      memStorage.single('file'), handleImportProjects);
router.post('/import/units',    allowRoles(ROLES.SUPER_ADMIN, ROLES.ADMIN),                      memStorage.single('file'), handleImportUnits);

// ── Exports (GET with query params: agentId, projectId, startDate, endDate) ───
// GET /api/v1/data/export/leads?agentId=xxx&projectId=yyy&startDate=2025-01-01&endDate=2025-12-31
router.get('/export/leads',    handleExportLeads);
router.get('/export/clients',  handleExportClients);
router.get('/export/payments', handleExportPayments);
router.get('/export/projects', handleExportProjects);
router.get('/export/units',    handleExportUnits);

export default router;