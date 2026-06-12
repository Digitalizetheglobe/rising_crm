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
import { LEAD_STATUSES, LEAD_SOURCES, PROPERTY_TYPES } from '../leads/lead.constants';

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

// Build comma-separated enum string for Excel data validation formulae
const toDropdown = (values: readonly string[]) =>
  `"${values.join(',')}"`;

// Normalize an incoming status string to its exact Mongoose enum value.
// Handles: 'New'→'NEW', 'Contacted'→'CONTACTED', 'Hot'→'NEW', 'Dead'→'LOST', etc.
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
  // Already a valid enum value (uppercase)
  if ((LEAD_STATUSES as readonly string[]).includes(raw.trim())) return raw.trim();
  return STATUS_MAP[key] || 'NEW';
};

// Normalize an incoming source string to its exact Mongoose enum value.
// Falls back to 'Other' if not matched, returns empty string if empty.
const normalizeSource = (raw: string): string => {
  if (!raw) return '';
  const val = raw.toString().trim();
  const lower = val.toLowerCase();
  const match = (LEAD_SOURCES as readonly string[]).find((s) => s.toLowerCase() === lower);
  return match || 'Other';
};

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
// Supports both the NEW 20-col Lead Master template and the legacy format.
// New template keys (after normaliseRow camelCase):
//   leadId, leadDate, leadSource, firstName, lastName, phoneNumber,
//   alternatePhone, emailId, city, assignedExecutive, leadStatus,
//   propertyType, budgetMin, budgetMax, preferredLocation, sizeRequired,
//   purpose, loanRequired, timelineToBuy, remarks
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
    const rowNum = i + 2;

    // ── Normalise: support both new template keys and legacy keys ─────────────
    // Name: new template splits into firstName + lastName
    const name = [
      row.firstName || row.name || '',
      row.lastName  || '',
    ].filter(Boolean).join(' ').trim();

    // Phone: new = phoneNumber, legacy = phone
    const phone = (row.phoneNumber || row.phone || '').toString().trim();

    // Email: new = emailId, legacy = email
    const email = (row.emailId || row.email || '').toString().trim();

    // Source: new = leadSource, legacy = source — normalize to enum or fallback to 'Other'
    const rawSource = (row.leadSource || row.source || '').toString().trim();
    const source = normalizeSource(rawSource);

    // Status: new = leadStatus, legacy = status — normalize to enum
    const status = normalizeStatus((row.leadStatus || row.status || '').toString());

    // Notes/Remarks: new = remarks, legacy = notes
    const notes = (row.remarks || row.notes || '').toString().trim();

    // Preferred location / city
    const preferredLocation = (row.preferredLocation || row.city || '').toString().trim();

    // Property type
    const propertyType = (row.propertyType || '').toString().trim();

    // Assigned executive: new = assignedExecutive (name), legacy = agentEmail
    const agentEmail        = (row.agentEmail || '').toString().trim();
    const assignedExecName  = (row.assignedExecutive || '').toString().trim();

    // ── Validate required fields ──────────────────────────────────────────────
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

    // ── Resolve assigned executive ────────────────────────────────────────────
    let assignedTo: Types.ObjectId;
    if (adminOverrideAgentId) {
      assignedTo = new Types.ObjectId(adminOverrideAgentId);
    } else if (assignedExecName) {
      // Try to find by name (case-insensitive) from new template
      const agent = await User.findOne({
        name: { $regex: new RegExp(`^${assignedExecName}$`, 'i') },
      });
      if (agent) {
        assignedTo = agent._id as Types.ObjectId;
      } else if (agentEmail) {
        // Fallback to email if name not found
        const agentByEmail = await User.findOne({ email: agentEmail.toLowerCase() });
        assignedTo = agentByEmail
          ? (agentByEmail._id as Types.ObjectId)
          : new Types.ObjectId(uploaderId);
      } else {
        assignedTo = new Types.ObjectId(uploaderId);
      }
    } else {
      // Legacy path: resolve by agentEmail
      assignedTo = await resolveAgent(agentEmail, uploaderId);
    }

    // ── Skip duplicate phone numbers ──────────────────────────────────────────
    const exists = await Lead.findOne({ phone });
    if (exists) {
      errors.push({ row: rowNum, errors: [`Phone ${phone} already exists — skipped`] });
      skipped++;
      continue;
    }

    await Lead.create({
      name,
      phone,
      email:             email || undefined,
      source,
      status,
      notes:             notes || undefined,
      preferredLocation: preferredLocation || undefined,
      propertyType:      propertyType || undefined,
      assignedTo,
      assignedBy:        new Types.ObjectId(uploaderId),
      assignedAt:        new Date(),
      createdBy:         new Types.ObjectId(uploaderId),
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
      address:     row.address ? { line1: row.address } : undefined,
      aadhaarNumber: row.aadhaar || undefined,
      panNumber:     row.pan || undefined,
      assignedTo,
      createdBy:   new Types.ObjectId(uploaderId),
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
  if (filters.agentId)   query.assignedTo       = new Types.ObjectId(filters.agentId);
  if (filters.projectId) query.interestedProject = new Types.ObjectId(filters.projectId);

  const leads = await Lead.find(query)
    .populate<{ assignedTo: { name: string; email: string } }>('assignedTo', 'name email')
    .populate<{ interestedProject: { name: string } }>('interestedProject', 'name')
    .sort({ createdAt: -1 });

  // ── Workbook matching Lead Master template exactly ─────────────────────────
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Rising CRM';
  wb.created = new Date();

  const sheet = wb.addWorksheet('Lead Master', {
    properties: { tabColor: { argb: 'FF00B0F0' } },
  });

  sheet.columns = [
    { header: 'Lead ID*',                key: 'leadId',            width: 15 },
    { header: 'Lead Date*',              key: 'leadDate',          width: 15 },
    { header: 'Lead Source*',            key: 'leadSource',        width: 20 },
    { header: 'First Name*',             key: 'firstName',         width: 20 },
    { header: 'Last Name',               key: 'lastName',          width: 20 },
    { header: 'Phone Number*',           key: 'phoneNumber',       width: 15 },
    { header: 'Alternate Phone',         key: 'alternatePhone',    width: 15 },
    { header: 'Email ID',                key: 'emailId',           width: 25 },
    { header: 'City',                    key: 'city',              width: 20 },
    { header: 'Assigned Executive',      key: 'assignedExecutive', width: 25 },
    { header: 'Lead Status*',            key: 'leadStatus',        width: 15 },
    { header: 'Property Type Interest',  key: 'propertyType',      width: 25 },
    { header: 'Budget Min',              key: 'budgetMin',         width: 15 },
    { header: 'Budget Max',              key: 'budgetMax',         width: 15 },
    { header: 'Preferred Location',      key: 'preferredLocation', width: 25 },
    { header: 'Size Required',           key: 'sizeRequired',      width: 15 },
    { header: 'Purpose',                 key: 'purpose',           width: 15 },
    { header: 'Loan Required',           key: 'loanRequired',      width: 15 },
    { header: 'Timeline to Buy',         key: 'timelineToBuy',     width: 20 },
    { header: 'Remarks',                 key: 'remarks',           width: 35 },
  ];

  // ── Header styling (identical to crmTemplate.service.ts) ──────────────────
  const headerRow = sheet.getRow(1);
  headerRow.eachCell((cell) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1B3A5C' } };
    cell.font = { color: { argb: 'FFFFFFFF' }, bold: true, size: 11 };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
    cell.border = { bottom: { style: 'medium', color: { argb: 'FFCCCCCC' } } };
    if (String(cell.value).includes('*')) {
      cell.font = { color: { argb: 'FFFFE066' }, bold: true, size: 11 };
    }
  });
  headerRow.height = 22;
  sheet.views = [{ state: 'frozen', ySplit: 1 }];

  // ── Populate data rows ─────────────────────────────────────────────────────
  leads.forEach((lead: any, idx: number) => {
    const rowIndex = idx + 2;
    const nameParts = (lead.name || '').trim().split(' ');
    const firstName = nameParts[0] || '';
    const lastName  = nameParts.slice(1).join(' ') || '';

    const row = sheet.addRow({
      leadId:            (lead._id as any)?.toString() || '',
      leadDate:          lead.createdAt ? new Date(lead.createdAt) : '',
      leadSource:        lead.source || '',
      firstName,
      lastName,
      phoneNumber:       lead.phone || '',
      alternatePhone:    '',
      emailId:           lead.email || '',
      city:              lead.preferredLocation || '',
      assignedExecutive: (lead.assignedTo as any)?.name || '',
      leadStatus:        lead.status || '',
      propertyType:      lead.propertyType || '',
      budgetMin:         '',
      budgetMax:         '',
      preferredLocation: lead.preferredLocation || '',
      sizeRequired:      '',
      purpose:           '',
      loanRequired:      '',
      timelineToBuy:     '',
      remarks:           lead.notes || '',
    });

    // Dropdowns — use exact model enum values
    sheet.getCell(`C${rowIndex}`).dataValidation = { type: 'list', allowBlank: true, formulae: [toDropdown(LEAD_SOURCES)] };
    sheet.getCell(`K${rowIndex}`).dataValidation = { type: 'list', allowBlank: true, formulae: [toDropdown(LEAD_STATUSES)] };
    sheet.getCell(`L${rowIndex}`).dataValidation = { type: 'list', allowBlank: true, formulae: [toDropdown(PROPERTY_TYPES)] };
    sheet.getCell(`Q${rowIndex}`).dataValidation = { type: 'list', allowBlank: true, formulae: ['"Self Use,Investment,Rental"'] };
    sheet.getCell(`R${rowIndex}`).dataValidation = { type: 'list', allowBlank: true, formulae: ['"Yes,No"'] };
    sheet.getCell(`S${rowIndex}`).dataValidation = { type: 'list', allowBlank: true, formulae: ['"Immediate,1-3 months,6+ months"'] };

    // Formats
    sheet.getCell(`B${rowIndex}`).numFmt = 'DD/MM/YYYY';
    sheet.getCell(`M${rowIndex}`).numFmt = '₹#,##0.00';
    sheet.getCell(`N${rowIndex}`).numFmt = '₹#,##0.00';

    // Alternating row shading
    row.eachCell((cell: any) => {
      cell.fill = {
        type: 'pattern', pattern: 'solid',
        fgColor: { argb: rowIndex % 2 === 0 ? 'FFF5F7FA' : 'FFFFFFFF' },
      };
    });
  });

  // ── Blank rows up to 1000 — keep dropdowns/formats ready ──────────────────
  const dataEnd = leads.length + 2;
  for (let i = dataEnd; i <= 1000; i++) {
    sheet.getCell(`C${i}`).dataValidation = { type: 'list', allowBlank: true, formulae: [toDropdown(LEAD_SOURCES)] };
    sheet.getCell(`K${i}`).dataValidation = { type: 'list', allowBlank: true, formulae: [toDropdown(LEAD_STATUSES)] };
    sheet.getCell(`L${i}`).dataValidation = { type: 'list', allowBlank: true, formulae: [toDropdown(PROPERTY_TYPES)] };
    sheet.getCell(`Q${i}`).dataValidation = { type: 'list', allowBlank: true, formulae: ['"Self Use,Investment,Rental"'] };
    sheet.getCell(`R${i}`).dataValidation = { type: 'list', allowBlank: true, formulae: ['"Yes,No"'] };
    sheet.getCell(`S${i}`).dataValidation = { type: 'list', allowBlank: true, formulae: ['"Immediate,1-3 months,6+ months"'] };
    sheet.getCell(`B${i}`).numFmt = 'DD/MM/YYYY';
    sheet.getCell(`M${i}`).numFmt = '₹#,##0.00';
    sheet.getCell(`N${i}`).numFmt = '₹#,##0.00';
  }

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
      address:    c.address?.line1 || '',
      aadhaar:    c.aadhaarNumber || '',
      pan:        c.panNumber || '',
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