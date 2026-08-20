import * as XLSX from 'xlsx';
import ExcelJS from 'exceljs';
import User from '../auth/auth.model';
import Lead from '../leads/lead.model';
import Client from '../clients/client.model';
import Payment from '../payments/payment.model';
import Project from '../projects/project.model';
import Unit from '../units/unit.model';
import Booking from '../bookings/booking.model';
import { ApiError } from '../../utils/ApiError';
import {
  LEAD_COLUMNS, CLIENT_COLUMNS, PAYMENT_COLUMNS,
  PROJECT_COLUMNS, UNIT_COLUMNS,
} from './templates/importExport.template';
import {
  validateLeadRow, validateClientRow, validatePaymentRow,
  validateProjectRow, validateUnitRow, RowError,
} from './importExport.validator';
import { LEAD_STATUSES, LEAD_SOURCES, PROPERTY_TYPES, LeadStatus, LeadSource } from '../leads/lead.constants';
import { getTenantId } from '../../middleware/tenant.middleware';
import { Op } from 'sequelize';

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

// Build comma-separated enum string for Excel data validation formulae
const toDropdown = (values: readonly string[]) =>
  `"${values.join(',')}"`;

const STATUS_MAP: Record<string, string> = {
  'new':                    'NEW',
  'hot':                    'NEW',
  'contacted':              'CONTACTED',
  'warm':                   'CONTACTED',
  'qualified':              'QUALIFIED',
  'interested':             'INTERESTED',
  'cold':                   'INTERESTED',
  'site visit scheduled':   'SITE_VISIT_SCHEDULED',
  'site visit':             'SITE_VISIT_SCHEDULED',
  'site visit completed':   'SITE_VISIT_COMPLETED',
  'negotiation':            'NEGOTIATION',
  'booking in progress':    'BOOKING_IN_PROGRESS',
  'booked':                 'BOOKED',
  'payment in progress':    'PAYMENT_IN_PROGRESS',
  'closed':                 'CLOSED',
  'closed won':             'CLOSED',
  'hold':                   'HOLD',
  'lost':                   'LOST',
  'dead':                   'LOST',
  'closed lost':            'LOST',
  'duplicate':              'DUPLICATE',
};
const normalizeStatus = (raw: string): string => {
  if (!raw) return 'NEW';
  const key = raw.toString().trim().toLowerCase();
  if ((LEAD_STATUSES as readonly string[]).includes(raw.trim())) return raw.trim();
  return STATUS_MAP[key] || 'NEW';
};

const normalizeSource = (raw: string): string => {
  if (!raw) return '';
  const val = raw.toString().trim();
  const lower = val.toLowerCase();
  const match = (LEAD_SOURCES as readonly string[]).find((s) => s.toLowerCase() === lower);
  return match || 'Other';
};

const parseExcel = (buffer: Buffer): Record<string, any>[] => {
  const workbook  = XLSX.read(buffer, { type: 'buffer', cellDates: true });
  const sheet     = workbook.Sheets[workbook.SheetNames[0]];
  return XLSX.utils.sheet_to_json(sheet, { defval: '' });
};

const normaliseRow = (row: Record<string, any>): Record<string, any> => {
  const result: Record<string, any> = {};
  for (const key of Object.keys(row)) {
    const clean = key.replace(/\*/g, '').trim();
    const camel = clean
      .replace(/\s+(.)/g, (_, c) => c.toUpperCase())
      .replace(/^./, c => c.toLowerCase());
    result[camel] = typeof row[key] === 'string' ? row[key].trim() : row[key];
  }
  return result;
};

const resolveAgent = async (
  agentEmail: string,
  uploaderId: string,
  tenantId: string,
  adminOverrideId?: string
): Promise<string> => {
  if (adminOverrideId) return adminOverrideId;

  if (agentEmail) {
    const agent = await User.findOne({ where: { email: agentEmail.toLowerCase(), tenantId } });
    if (agent) return agent.id;
  }

  return uploaderId;
};

const styleHeader = (sheet: ExcelJS.Worksheet) => {
  const headerRow = sheet.getRow(1);
  headerRow.eachCell((cell: any) => {
    cell.fill   = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1B3A5C' } };
    cell.font   = { color: { argb: 'FFFFFFFF' }, bold: true, size: 11 };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
    cell.border = {
      bottom: { style: 'medium', color: { argb: 'FFCCCCCC' } },
    };
  });
  headerRow.height = 22;
};

// ─────────────────────────────────────────────────────────────────────────────
// IMPORT SERVICES
// ─────────────────────────────────────────────────────────────────────────────

interface ImportResult {
  inserted: number;
  skipped:  number;
  errors:   RowError[];
}

export const importLeads = async (
  buffer: Buffer,
  uploaderId: string,
  adminOverrideAgentId?: string
): Promise<ImportResult> => {
  const tenantId = getTenantId();
  const raw    = parseExcel(buffer);
  const errors: RowError[] = [];
  let inserted = 0;
  let skipped  = 0;

  for (let i = 0; i < raw.length; i++) {
    const row    = normaliseRow(raw[i]);
    const rowNum = i + 2;

    const name = [
      row.firstName || row.name || '',
      row.lastName  || '',
    ].filter(Boolean).join(' ').trim();

    const phone = (row.phoneNumber || row.phone || '').toString().trim();
    const email = (row.emailId || row.email || '').toString().trim();
    const rawSource = (row.leadSource || row.source || '').toString().trim();
    const source = normalizeSource(rawSource);
    const status = normalizeStatus((row.leadStatus || row.status || '').toString());
    const notes = (row.remarks || row.notes || '').toString().trim();
    const preferredLocation = (row.preferredLocation || row.city || '').toString().trim();
    const propertyType = (row.propertyType || '').toString().trim();
    const agentEmail        = (row.agentEmail || '').toString().trim();
    const assignedExecName  = (row.assignedExecutive || '').toString().trim();

    const rowErrors: string[] = [];
    if (!name)                              rowErrors.push('Name / First Name is required');
    if (!/^[6-9]\d{9}$/.test(phone))       rowErrors.push('Valid 10-digit phone number is required');
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) rowErrors.push('Invalid email format');
    if (!source)                            rowErrors.push('Lead Source is required');

    if (rowErrors.length) {
      errors.push({ row: rowNum, errors: rowErrors });
      skipped++;
      continue;
    }

    let assignedTo: string;
    if (adminOverrideAgentId) {
      assignedTo = adminOverrideAgentId;
    } else if (assignedExecName) {
      const agent = await User.findOne({
        where: { tenantId, name: { [Op.iLike]: assignedExecName } }
      });
      if (agent) {
        assignedTo = agent.id;
      } else if (agentEmail) {
        const agentByEmail = await User.findOne({ where: { tenantId, email: agentEmail.toLowerCase() } });
        assignedTo = agentByEmail ? agentByEmail.id : uploaderId;
      } else {
        assignedTo = uploaderId;
      }
    } else {
      assignedTo = await resolveAgent(agentEmail, uploaderId, tenantId);
    }

    const exists = await Lead.findOne({ where: { phone, tenantId } });
    if (exists) {
      errors.push({ row: rowNum, errors: [`Phone ${phone} already exists — skipped`] });
      skipped++;
      continue;
    }

    await Lead.create({
      tenantId,
      name,
      phone,
      email:             email || undefined,
      source:            source as LeadSource,
      status:            status as LeadStatus,
      notes:             notes || undefined,
      preferredLocation: preferredLocation || undefined,
      propertyType:      propertyType || undefined,
      purpose:           (row.purpose || '').toString().trim() || undefined,
      assignedTo,
      assignedBy:        uploaderId,
      assignedAt:        new Date(),
      createdBy:         uploaderId,
    } as any);

    inserted++;
  }

  return { inserted, skipped, errors };
};

export const importClients = async (
  buffer: Buffer,
  uploaderId: string,
  adminOverrideAgentId?: string
): Promise<ImportResult> => {
  const tenantId = getTenantId();
  const raw    = parseExcel(buffer);
  const errors: RowError[] = [];
  let inserted = 0;
  let skipped  = 0;

  for (let i = 0; i < raw.length; i++) {
    const row    = normaliseRow(raw[i]);
    const rowNum = i + 2;

    const err = validateClientRow(row, rowNum);
    if (err) { errors.push(err); skipped++; continue; }

    const assignedTo = await resolveAgent(row.agentEmail, uploaderId, tenantId, adminOverrideAgentId);

    const exists = await Client.findOne({ where: { phone: row.phone, tenantId } });
    if (exists) {
      errors.push({ row: rowNum, errors: [`Phone ${row.phone} already exists — skipped`] });
      skipped++;
      continue;
    }

    await Client.create({
      tenantId,
      name:        row.name,
      phone:       row.phone,
      email:       row.email || undefined,
      address:     row.address ? { line1: row.address } : undefined,
      aadhaarNumber: row.aadhaar || undefined,
      panNumber:     row.pan || undefined,
      assignedTo,
      createdBy:   uploaderId,
    } as any);

    inserted++;
  }

  return { inserted, skipped, errors };
};

export const importPayments = async (
  buffer: Buffer,
  uploaderId: string,
  adminOverrideAgentId?: string
): Promise<ImportResult> => {
  const tenantId = getTenantId();
  const raw    = parseExcel(buffer);
  const errors: RowError[] = [];
  let inserted = 0;
  let skipped  = 0;

  for (let i = 0; i < raw.length; i++) {
    const row    = normaliseRow(raw[i]);
    const rowNum = i + 2;

    const err = validatePaymentRow(row, rowNum);
    if (err) { errors.push(err); skipped++; continue; }

    const booking = await Booking.findOne({ where: { id: row.bookingId, tenantId } });
    if (!booking) {
      errors.push({ row: rowNum, errors: [`Booking ID ${row.bookingId} not found`] });
      skipped++;
      continue;
    }

    const client = await Client.findOne({ where: { phone: row.clientPhone, tenantId } });
    if (!client) {
      errors.push({ row: rowNum, errors: [`Client with phone ${row.clientPhone} not found`] });
      skipped++;
      continue;
    }

    const assignedTo = await resolveAgent(row.agentEmail, uploaderId, tenantId, adminOverrideAgentId);

    await Payment.create({
      tenantId,
      bookingId:     booking.id,
      clientId:      client.id,
      amount:        Number(row.amount),
      dueDate:       new Date(row.dueDate),
      paidDate:      row.paidDate ? new Date(row.paidDate) : undefined,
      status:        row.status,
      paymentType:   row.paymentMode || 'Cash', // Defaulting to Cash if unknown, since model might require enum
      receiptNumber: row.receiptNumber || undefined,
      recordedBy:    assignedTo,
    } as any);

    inserted++;
  }

  return { inserted, skipped, errors };
};

export const importProjects = async (buffer: Buffer): Promise<ImportResult> => {
  const tenantId = getTenantId();
  const raw    = parseExcel(buffer);
  const errors: RowError[] = [];
  let inserted = 0;
  let skipped  = 0;

  for (let i = 0; i < raw.length; i++) {
    const row    = normaliseRow(raw[i]);
    const rowNum = i + 2;

    const err = validateProjectRow(row, rowNum);
    if (err) { errors.push(err); skipped++; continue; }

    const exists = await Project.findOne({
      where: { tenantId, name: { [Op.iLike]: row.name } },
    });
    if (exists) {
      errors.push({ row: rowNum, errors: [`Project "${row.name}" already exists — skipped`] });
      skipped++;
      continue;
    }

    await Project.create({
      tenantId,
      name:        row.name,
      location:    row.location,
      description: row.description || undefined,
      totalUnits:  Number(row.totalUnits),
      launchDate:  row.launchDate ? new Date(row.launchDate) : undefined,
      status:      row.status,
      amenities:   row.amenities
        ? row.amenities.split(',').map((a: string) => a.trim()).filter(Boolean)
        : [],
    } as any);

    inserted++;
  }

  return { inserted, skipped, errors };
};

export const importUnits = async (buffer: Buffer): Promise<ImportResult> => {
  const tenantId = getTenantId();
  const raw    = parseExcel(buffer);
  const errors: RowError[] = [];
  let inserted = 0;
  let skipped  = 0;

  for (let i = 0; i < raw.length; i++) {
    const row    = normaliseRow(raw[i]);
    const rowNum = i + 2;

    const err = validateUnitRow(row, rowNum);
    if (err) { errors.push(err); skipped++; continue; }

    const project = await Project.findOne({
      where: { tenantId, name: { [Op.iLike]: row.projectName } },
    });
    if (!project) {
      errors.push({ row: rowNum, errors: [`Project "${row.projectName}" not found`] });
      skipped++;
      continue;
    }

    const exists = await Unit.findOne({
      where: { tenantId, projectId: project.id, unitNumber: row.unitNumber },
    });
    if (exists) {
      errors.push({ row: rowNum, errors: [`Unit ${row.unitNumber} in "${row.projectName}" already exists`] });
      skipped++;
      continue;
    }

    await Unit.create({
      tenantId,
      projectId:  project.id,
      unitNumber: row.unitNumber,
      type:       row.type,
      floor:      row.floor ? Number(row.floor) : undefined,
      area:       Number(row.area),
      price:      Number(row.price),
      status:     row.status,
      facing:     row.facing || undefined,
    } as any);

    inserted++;
  }

  return { inserted, skipped, errors };
};

// ─────────────────────────────────────────────────────────────────────────────
// EXPORT SERVICES
// ─────────────────────────────────────────────────────────────────────────────

export interface ExportFilters {
  agentId?:    string;
  projectId?:  string;
  startDate?:  string;
  endDate?:    string;
}

const buildDateFilter = (startDate?: string, endDate?: string) => {
  if (!startDate && !endDate) return {};
  const filter: any = {};
  if (startDate) filter[Op.gte] = new Date(startDate);
  if (endDate)   filter[Op.lte] = new Date(new Date(endDate).setHours(23, 59, 59));
  return { createdAt: filter };
};

export const exportLeads = async (filters: ExportFilters): Promise<ExcelJS.Buffer> => {
  const tenantId = getTenantId();
  const query: any = {
    tenantId,
    ...buildDateFilter(filters.startDate, filters.endDate),
  };
  if (filters.agentId)   query.assignedTo = filters.agentId;
  if (filters.projectId) query.interestedProjectId = filters.projectId;

  const leads = await Lead.findAll({
    where: query,
    include: [
      { model: User, as: 'assignedUser', attributes: ['name', 'email'] },
      { model: Project, as: 'interestedProject', attributes: ['name'] },
    ],
    order: [['createdAt', 'DESC']],
  });

  const wb = new ExcelJS.Workbook();
  wb.creator = 'Rising CRM';
  wb.created = new Date();

  const sheet = wb.addWorksheet('Lead Master', {
    properties: { tabColor: { argb: 'FF00B0F0' } },
  });

  sheet.columns = [
    { header: 'Lead ID',           key: 'leadId',            width: 30 },
    { header: 'Lead Source',        key: 'leadSource',        width: 18 },
    { header: 'Project',            key: 'project',           width: 22 },
    { header: 'Customer Name',      key: 'customerName',      width: 25 },
    { header: 'Mobile Number',      key: 'mobileNumber',      width: 16 },
    { header: 'Email',              key: 'email',             width: 28 },
    { header: 'Budget',             key: 'budget',            width: 16 },
    { header: 'Property Type',      key: 'propertyType',      width: 18 },
    { header: 'Preferred Location', key: 'preferredLocation', width: 22 },
    { header: 'Purpose',            key: 'purpose',           width: 14 },
  ];

  const headerRow = sheet.getRow(1);
  headerRow.eachCell((cell) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1B3A5C' } };
    cell.font = { color: { argb: 'FFFFFFFF' }, bold: true, size: 11 };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
    cell.border = { bottom: { style: 'medium', color: { argb: 'FFCCCCCC' } } };
  });
  headerRow.height = 22;
  sheet.views = [{ state: 'frozen', ySplit: 1 }];

  leads.forEach((lead: any, idx: number) => {
    const rowIndex = idx + 2;

    const row = sheet.addRow({
      leadId:            lead.id || '',
      leadSource:        lead.source || '',
      project:           lead.interestedProject?.name || '',
      customerName:      lead.name || '',
      mobileNumber:      lead.phone || '',
      email:             lead.email || '',
      budget:            lead.budgetRange || '',
      propertyType:      lead.propertyType || '',
      preferredLocation: lead.preferredLocation || '',
      purpose:           lead.purpose || '',
    });

    // Dropdown validation for applicable columns
    sheet.getCell(`B${rowIndex}`).dataValidation = { type: 'list', allowBlank: true, formulae: [toDropdown(LEAD_SOURCES)] };
    sheet.getCell(`H${rowIndex}`).dataValidation = { type: 'list', allowBlank: true, formulae: [toDropdown(PROPERTY_TYPES)] };
    sheet.getCell(`J${rowIndex}`).dataValidation = { type: 'list', allowBlank: true, formulae: ['"Buy,Invest,Rental"'] };

    row.eachCell((cell: any) => {
      cell.fill = {
        type: 'pattern', pattern: 'solid',
        fgColor: { argb: rowIndex % 2 === 0 ? 'FFF5F7FA' : 'FFFFFFFF' },
      };
    });
  });

  // Extend dropdowns for empty rows up to row 1000
  const dataEnd = leads.length + 2;
  for (let i = dataEnd; i <= 1000; i++) {
    sheet.getCell(`B${i}`).dataValidation = { type: 'list', allowBlank: true, formulae: [toDropdown(LEAD_SOURCES)] };
    sheet.getCell(`H${i}`).dataValidation = { type: 'list', allowBlank: true, formulae: [toDropdown(PROPERTY_TYPES)] };
    sheet.getCell(`J${i}`).dataValidation = { type: 'list', allowBlank: true, formulae: ['"Buy,Invest,Rental"'] };
  }

  return wb.xlsx.writeBuffer();
};

export const exportClients = async (filters: ExportFilters): Promise<ExcelJS.Buffer> => {
  const tenantId = getTenantId();
  const query: any = {
    tenantId,
    ...buildDateFilter(filters.startDate, filters.endDate),
  };
  if (filters.agentId) query.assignedTo = filters.agentId;

  const clients = await Client.findAll({
    where: query,
    include: [{ model: User, as: 'assignedUser', attributes: ['name', 'email'] }],
    order: [['createdAt', 'DESC']],
  });

  const wb    = new ExcelJS.Workbook();
  const sheet = wb.addWorksheet('Clients');
  sheet.columns = CLIENT_COLUMNS;
  styleHeader(sheet);

  clients.forEach((c: any) => {
    sheet.addRow({
      name:       c.name,
      phone:      c.phone,
      email:      c.email || '',
      address:    c.address?.line1 || '',
      aadhaar:    c.aadhaarNumber || '',
      pan:        c.panNumber || '',
      agentEmail: c.assignedUser?.email || '',
    });
  });

  return wb.xlsx.writeBuffer();
};

export const exportPayments = async (filters: ExportFilters): Promise<ExcelJS.Buffer> => {
  const tenantId = getTenantId();
  const query: any = {
    tenantId,
    ...buildDateFilter(filters.startDate, filters.endDate),
  };
  if (filters.agentId) query.recordedBy = filters.agentId;

  if (filters.projectId) {
    const bookings = await Booking.findAll({
      where: { projectId: filters.projectId, tenantId },
      attributes: ['id']
    });
    query.bookingId = { [Op.in]: bookings.map((b: any) => b.id) };
  }

  const payments = await Payment.findAll({
    where: query,
    include: [
      { model: Client, as: 'client', attributes: ['name', 'phone'] },
      { model: Booking, as: 'booking', attributes: ['id'] },
      { model: User, as: 'recordedByUser', attributes: ['email'] },
    ],
    order: [['createdAt', 'DESC']],
  });

  const wb    = new ExcelJS.Workbook();
  const sheet = wb.addWorksheet('Payments');
  sheet.columns = PAYMENT_COLUMNS;
  styleHeader(sheet);

  payments.forEach((p: any) => {
    sheet.addRow({
      clientPhone:   p.client?.phone || '',
      bookingId:     p.booking?.id || '',
      amount:        p.amount,
      dueDate:       new Date(p.dueDate).toLocaleDateString('en-IN'),
      paidDate:      p.paidDate ? new Date(p.paidDate).toLocaleDateString('en-IN') : '',
      status:        p.status,
      paymentMode:   p.paymentType || '',
      receiptNumber: p.receiptNumber || '',
      agentEmail:    p.recordedByUser?.email || '',
    });
  });

  return wb.xlsx.writeBuffer();
};

export const exportProjects = async (filters: ExportFilters): Promise<ExcelJS.Buffer> => {
  const tenantId = getTenantId();
  const query: any = {
    tenantId,
    ...buildDateFilter(filters.startDate, filters.endDate),
  };
  if (filters.projectId) query.id = filters.projectId;

  const projects = await Project.findAll({ where: query, order: [['createdAt', 'DESC']] });

  const wb    = new ExcelJS.Workbook();
  const sheet = wb.addWorksheet('Projects');
  sheet.columns = PROJECT_COLUMNS;
  styleHeader(sheet);

  projects.forEach((p: any) => {
    sheet.addRow({
      name:        p.name,
      location:    p.location,
      description: p.description || '',
      totalUnits:  p.totalUnits,
      launchDate:  p.launchDate
        ? new Date(p.launchDate).toLocaleDateString('en-IN')
        : '',
      status:      p.status,
      amenities:   Array.isArray(p.amenities) ? p.amenities.join(', ') : '',
    });
  });

  return wb.xlsx.writeBuffer();
};

export const exportUnits = async (filters: ExportFilters): Promise<ExcelJS.Buffer> => {
  const tenantId = getTenantId();
  const query: any = {
    tenantId,
    ...buildDateFilter(filters.startDate, filters.endDate),
  };
  if (filters.projectId) query.projectId = filters.projectId;

  const units = await Unit.findAll({
    where: query,
    include: [{ model: Project, as: 'project', attributes: ['name'] }],
    order: [['createdAt', 'DESC']],
  });

  const wb    = new ExcelJS.Workbook();
  const sheet = wb.addWorksheet('Units');
  sheet.columns = UNIT_COLUMNS;
  styleHeader(sheet);

  units.forEach((u: any) => {
    sheet.addRow({
      projectName: u.project?.name || '',
      unitNumber:  u.unitNumber,
      type:        u.type,
      floor:       u.floor ?? '',
      area:        u.area,
      price:       u.price,
      status:      u.status,
      facing:      u.facing || '',
    });
  });

  return wb.xlsx.writeBuffer();
};

type TemplateType = 'leads' | 'clients' | 'payments' | 'projects' | 'units';

const TEMPLATE_COLUMNS: Record<TemplateType, any[]> = {
  leads:    LEAD_COLUMNS,
  clients:  CLIENT_COLUMNS,
  payments: PAYMENT_COLUMNS,
  projects: PROJECT_COLUMNS,
  units:    UNIT_COLUMNS,
};

export const downloadTemplate = async (type: TemplateType): Promise<ExcelJS.Buffer> => {
  const columns = TEMPLATE_COLUMNS[type];
  if (!columns) throw new ApiError(400, `Invalid template type: ${type}`);

  const wb    = new ExcelJS.Workbook();
  const sheet = wb.addWorksheet(`${type.charAt(0).toUpperCase() + type.slice(1)} Template`);
  sheet.columns = columns;
  styleHeader(sheet);

  const exampleRow: Record<string, string> = {};
  columns.forEach(col => { exampleRow[col.key] = `example_${col.key}`; });
  const row = sheet.addRow(exampleRow);
  row.eachCell((cell: any) => {
    cell.font = { italic: true, color: { argb: 'FF999999' } };
  });

  return wb.xlsx.writeBuffer();
};