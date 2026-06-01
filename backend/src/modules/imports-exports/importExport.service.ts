import * as XLSX from 'xlsx';
import ExcelJS from 'exceljs';
import { Types } from 'mongoose';
import { User } from '../users/user.model';
import { Lead } from '../leads/lead.model';
import { Client } from '../clients/client.model';
import { Payment } from '../payments/payment.model';
import { Project } from '../projects/project.model';
import { Unit } from '../units/unit.model';
import { Booking } from '../bookings/booking.model';
import { ApiError } from '../../utils/ApiError';
import {
  LEAD_COLUMNS, CLIENT_COLUMNS, PAYMENT_COLUMNS,
  PROJECT_COLUMNS, UNIT_COLUMNS,
} from './templates/importExport.template';
import {
  validateLeadRow, validateClientRow, validatePaymentRow,
  validateProjectRow, validateUnitRow, RowError,
} from './importExport.validator';

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

// Parse the uploaded file buffer into an array of row objects
const parseExcel = (buffer: Buffer): Record<string, any>[] => {
  const workbook  = XLSX.read(buffer, { type: 'buffer', cellDates: true });
  const sheet     = workbook.Sheets[workbook.SheetNames[0]];
  return XLSX.utils.sheet_to_json(sheet, { defval: '' });
};

// Normalise header keys — remove *, trim, lowercase, camelCase
const normaliseRow = (row: Record<string, any>): Record<string, any> => {
  const result: Record<string, any> = {};
  for (const key of Object.keys(row)) {
    const clean = key.replace(/\*/g, '').trim();
    // convert "Agent Email" → "agentEmail"
    const camel = clean
      .replace(/\s+(.)/g, (_, c) => c.toUpperCase())
      .replace(/^./, c => c.toLowerCase());
    result[camel] = typeof row[key] === 'string' ? row[key].trim() : row[key];
  }
  return result;
};

// Resolve agent: first try Excel agentEmail column, fallback to uploaderId
const resolveAgent = async (
  agentEmail: string,
  uploaderId: string,
  adminOverrideId?: string
): Promise<Types.ObjectId> => {
  if (adminOverrideId) return new Types.ObjectId(adminOverrideId);

  if (agentEmail) {
    const agent = await User.findOne({ email: agentEmail.toLowerCase() });
    if (agent) return agent._id as Types.ObjectId;
  }

  // fallback: assign to uploader
  return new Types.ObjectId(uploaderId);
};

// Style the header row of an ExcelJS worksheet
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

// ── Import Leads ─────────────────────────────────────────────────────────────
export const importLeads = async (
  buffer: Buffer,
  uploaderId: string,
  adminOverrideAgentId?: string
): Promise<ImportResult> => {
  const raw    = parseExcel(buffer);
  const errors: RowError[] = [];
  let inserted = 0;
  let skipped  = 0;

  for (let i = 0; i < raw.length; i++) {
    const row    = normaliseRow(raw[i]);
    const rowNum = i + 2; // +2 because row 1 is header

    const err = validateLeadRow(row, rowNum);
    if (err) { errors.push(err); skipped++; continue; }

    // Resolve project by name if provided
    let projectId: Types.ObjectId | undefined;
    if (row.projectName) {
      const project = await Project.findOne({
        name: { $regex: new RegExp(`^${row.projectName}$`, 'i') },
      });
      if (project) projectId = project._id as Types.ObjectId;
    }

    const assignedTo = await resolveAgent(row.agentEmail, uploaderId, adminOverrideAgentId);

    // Skip duplicate phone numbers
    const exists = await Lead.findOne({ phone: row.phone });
    if (exists) {
      errors.push({ row: rowNum, errors: [`Phone ${row.phone} already exists — skipped`] });
      skipped++;
      continue;
    }

    await Lead.create({
      name:             row.name,
      phone:            row.phone,
      email:            row.email || undefined,
      source:           row.source,
      status:           row.status || 'NEW',
      notes:            row.notes || undefined,
      nextFollowUpDate: row.nextFollowUp || undefined,
      interestedProject: projectId,
      assignedTo,
      assignedBy:  new Types.ObjectId(uploaderId),
      assignedAt:  new Date(),
      createdBy:   new Types.ObjectId(uploaderId),
    });

    inserted++;
  }

  return { inserted, skipped, errors };
};

// ── Import Clients ────────────────────────────────────────────────────────────
export const importClients = async (
  buffer: Buffer,
  uploaderId: string,
  adminOverrideAgentId?: string
): Promise<ImportResult> => {
  const raw    = parseExcel(buffer);
  const errors: RowError[] = [];
  let inserted = 0;
  let skipped  = 0;

  for (let i = 0; i < raw.length; i++) {
    const row    = normaliseRow(raw[i]);
    const rowNum = i + 2;

    const err = validateClientRow(row, rowNum);
    if (err) { errors.push(err); skipped++; continue; }

    const assignedTo = await resolveAgent(row.agentEmail, uploaderId, adminOverrideAgentId);

    const exists = await Client.findOne({ phone: row.phone });
    if (exists) {
      errors.push({ row: rowNum, errors: [`Phone ${row.phone} already exists — skipped`] });
      skipped++;
      continue;
    }

    await Client.create({
      name:        row.name,
      phone:       row.phone,
      email:       row.email || undefined,
      address:     row.address || undefined,
      aadhaar:     row.aadhaar || undefined,
      pan:         row.pan || undefined,
      assignedTo,
    });

    inserted++;
  }

  return { inserted, skipped, errors };
};

// ── Import Payments ───────────────────────────────────────────────────────────
export const importPayments = async (
  buffer: Buffer,
  uploaderId: string,
  adminOverrideAgentId?: string
): Promise<ImportResult> => {
  const raw    = parseExcel(buffer);
  const errors: RowError[] = [];
  let inserted = 0;
  let skipped  = 0;

  for (let i = 0; i < raw.length; i++) {
    const row    = normaliseRow(raw[i]);
    const rowNum = i + 2;

    const err = validatePaymentRow(row, rowNum);
    if (err) { errors.push(err); skipped++; continue; }

    // Verify booking exists
    const booking = await Booking.findById(row.bookingId);
    if (!booking) {
      errors.push({ row: rowNum, errors: [`Booking ID ${row.bookingId} not found`] });
      skipped++;
      continue;
    }

    const client = await Client.findOne({ phone: row.clientPhone });
    if (!client) {
      errors.push({ row: rowNum, errors: [`Client with phone ${row.clientPhone} not found`] });
      skipped++;
      continue;
    }

    const assignedTo = await resolveAgent(row.agentEmail, uploaderId, adminOverrideAgentId);

    await Payment.create({
      booking:       booking._id,
      client:        client._id,
      amount:        Number(row.amount),
      dueDate:       new Date(row.dueDate),
      paidDate:      row.paidDate ? new Date(row.paidDate) : undefined,
      status:        row.status,
      paymentMode:   row.paymentMode || undefined,
      receiptNumber: row.receiptNumber || undefined,
      recordedBy:    assignedTo,
    });

    inserted++;
  }

  return { inserted, skipped, errors };
};

// ── Import Projects ───────────────────────────────────────────────────────────
export const importProjects = async (buffer: Buffer): Promise<ImportResult> => {
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
      name: { $regex: new RegExp(`^${row.name}$`, 'i') },
    });
    if (exists) {
      errors.push({ row: rowNum, errors: [`Project "${row.name}" already exists — skipped`] });
      skipped++;
      continue;
    }

    await Project.create({
      name:        row.name,
      location:    row.location,
      description: row.description || undefined,
      totalUnits:  Number(row.totalUnits),
      launchDate:  row.launchDate ? new Date(row.launchDate) : undefined,
      status:      row.status,
      amenities:   row.amenities
        ? row.amenities.split(',').map((a: string) => a.trim()).filter(Boolean)
        : [],
    });

    inserted++;
  }

  return { inserted, skipped, errors };
};

// ── Import Units ──────────────────────────────────────────────────────────────
export const importUnits = async (buffer: Buffer): Promise<ImportResult> => {
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
      name: { $regex: new RegExp(`^${row.projectName}$`, 'i') },
    });
    if (!project) {
      errors.push({ row: rowNum, errors: [`Project "${row.projectName}" not found`] });
      skipped++;
      continue;
    }

    const exists = await Unit.findOne({
      project:    project._id,
      unitNumber: row.unitNumber,
    });
    if (exists) {
      errors.push({ row: rowNum, errors: [`Unit ${row.unitNumber} in "${row.projectName}" already exists`] });
      skipped++;
      continue;
    }

    await Unit.create({
      project:    project._id,
      unitNumber: row.unitNumber,
      type:       row.type,
      floor:      row.floor ? Number(row.floor) : undefined,
      area:       Number(row.area),
      price:      Number(row.price),
      status:     row.status,
      facing:     row.facing || undefined,
    });

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
  const filter: Record<string, Date> = {};
  if (startDate) filter.$gte = new Date(startDate);
  if (endDate)   filter.$lte = new Date(new Date(endDate).setHours(23, 59, 59));
  return { createdAt: filter };
};

// ── Export Leads ──────────────────────────────────────────────────────────────
export const exportLeads = async (filters: ExportFilters): Promise<ExcelJS.Buffer> => {
  const query: Record<string, any> = {
    ...buildDateFilter(filters.startDate, filters.endDate),
  };
  if (filters.agentId)   query.assignedTo = new Types.ObjectId(filters.agentId);
  if (filters.projectId) query.project    = new Types.ObjectId(filters.projectId);

  const leads = await Lead.find(query)
    .populate<{ assignedTo: { name: string; email: string } }>('assignedTo', 'name email')
    .populate<{ project: { name: string } }>('project', 'name')
    .sort({ createdAt: -1 });

  const wb    = new ExcelJS.Workbook();
  const sheet = wb.addWorksheet('Leads');
  sheet.columns = LEAD_COLUMNS;
  styleHeader(sheet);

  leads.forEach((lead: any) => {
    sheet.addRow({
      name:         lead.name,
      phone:        lead.phone,
      email:        lead.email || '',
      source:       lead.source,
      status:       lead.status,
      projectName:  (lead.project as any)?.name || '',
      notes:        lead.notes || '',
      nextFollowUp: lead.nextFollowUp
        ? new Date(lead.nextFollowUp).toLocaleDateString('en-IN')
        : '',
      agentEmail:   (lead.assignedTo as any)?.email || '',
    });
  });

  // alternate row shading
  sheet.eachRow((row: any, i: number) => {
    if (i > 1) {
      row.eachCell((cell: any) => {
        cell.fill = {
          type: 'pattern', pattern: 'solid',
          fgColor: { argb: i % 2 === 0 ? 'FFF5F7FA' : 'FFFFFFFF' },
        };
      });
    }
  });

  return wb.xlsx.writeBuffer();
};

// ── Export Clients ────────────────────────────────────────────────────────────
export const exportClients = async (filters: ExportFilters): Promise<ExcelJS.Buffer> => {
  const query: Record<string, any> = {
    ...buildDateFilter(filters.startDate, filters.endDate),
  };
  if (filters.agentId) query.assignedTo = new Types.ObjectId(filters.agentId);

  const clients = await Client.find(query)
    .populate<{ assignedTo: { name: string; email: string } }>('assignedTo', 'name email')
    .sort({ createdAt: -1 });

  const wb    = new ExcelJS.Workbook();
  const sheet = wb.addWorksheet('Clients');
  sheet.columns = CLIENT_COLUMNS;
  styleHeader(sheet);

  clients.forEach((c: any) => {
    sheet.addRow({
      name:       c.name,
      phone:      c.phone,
      email:      c.email || '',
      address:    c.address || '',
      aadhaar:    c.aadhaar || '',
      pan:        c.pan || '',
      agentEmail: (c.assignedTo as any)?.email || '',
    });
  });

  return wb.xlsx.writeBuffer();
};

// ── Export Payments ───────────────────────────────────────────────────────────
export const exportPayments = async (filters: ExportFilters): Promise<ExcelJS.Buffer> => {
  const query: Record<string, any> = {
    ...buildDateFilter(filters.startDate, filters.endDate),
  };
  if (filters.agentId) query.recordedBy = new Types.ObjectId(filters.agentId);

  // if projectId filter — find all bookings for that project first
  if (filters.projectId) {
    const bookings = await Booking.find({
      project: new Types.ObjectId(filters.projectId),
    }).select('_id');
    query.booking = { $in: bookings.map((b: any) => b._id) };
  }

  const payments = await Payment.find(query)
    .populate<{ client: { name: string; phone: string } }>('client', 'name phone')
    .populate<{ booking: { _id: Types.ObjectId } }>('booking', '_id')
    .populate<{ recordedBy: { email: string } }>('recordedBy', 'email')
    .sort({ createdAt: -1 });

  const wb    = new ExcelJS.Workbook();
  const sheet = wb.addWorksheet('Payments');
  sheet.columns = PAYMENT_COLUMNS;
  styleHeader(sheet);

  payments.forEach((p: any) => {
    sheet.addRow({
      clientPhone:   (p.client as any)?.phone || '',
      bookingId:     (p.booking as any)?._id?.toString() || '',
      amount:        p.amount,
      dueDate:       new Date(p.dueDate).toLocaleDateString('en-IN'),
      paidDate:      p.paidDate ? new Date(p.paidDate).toLocaleDateString('en-IN') : '',
      status:        p.status,
      paymentMode:   p.paymentMode || '',
      receiptNumber: p.receiptNumber || '',
      agentEmail:    (p.recordedBy as any)?.email || '',
    });
  });

  return wb.xlsx.writeBuffer();
};

// ── Export Projects ───────────────────────────────────────────────────────────
export const exportProjects = async (filters: ExportFilters): Promise<ExcelJS.Buffer> => {
  const query: Record<string, any> = {
    ...buildDateFilter(filters.startDate, filters.endDate),
  };
  if (filters.projectId) query._id = new Types.ObjectId(filters.projectId);

  const projects = await Project.find(query).sort({ createdAt: -1 });

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

// ── Export Units ──────────────────────────────────────────────────────────────
export const exportUnits = async (filters: ExportFilters): Promise<ExcelJS.Buffer> => {
  const query: Record<string, any> = {
    ...buildDateFilter(filters.startDate, filters.endDate),
  };
  if (filters.projectId) query.project = new Types.ObjectId(filters.projectId);

  const units = await Unit.find(query)
    .populate<{ project: { name: string } }>('project', 'name')
    .sort({ createdAt: -1 });

  const wb    = new ExcelJS.Workbook();
  const sheet = wb.addWorksheet('Units');
  sheet.columns = UNIT_COLUMNS;
  styleHeader(sheet);

  units.forEach((u: any) => {
    sheet.addRow({
      projectName: (u.project as any)?.name || '',
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

// ── Download blank template ───────────────────────────────────────────────────
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

  // Add one example row with placeholder text
  const exampleRow: Record<string, string> = {};
  columns.forEach(col => { exampleRow[col.key] = `example_${col.key}`; });
  const row = sheet.addRow(exampleRow);
  row.eachCell((cell: any) => {
    cell.font = { italic: true, color: { argb: 'FF999999' } };
  });

  return wb.xlsx.writeBuffer();
};