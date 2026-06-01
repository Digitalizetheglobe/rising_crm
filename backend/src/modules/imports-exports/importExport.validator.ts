import {
    VALID_LEAD_SOURCES,
    VALID_LEAD_STATUSES,
    VALID_UNIT_TYPES,
    VALID_UNIT_STATUSES,
    VALID_PROJECT_STATUSES,
    VALID_PAYMENT_STATUSES,
    VALID_PAYMENT_MODES,
  } from './templates/importExport.template';
  
  export interface RowError {
    row: number;
    errors: string[];
  }
  
  const isValidEmail = (email: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  
  const isValidPhone = (phone: string) =>
    /^[6-9]\d{9}$/.test(String(phone).trim());
  
  // ── Leads ──────────────────────────────────────────────────────────────────
  export const validateLeadRow = (row: Record<string, any>, rowNum: number): RowError | null => {
    const errors: string[] = [];
  
    if (!row.name?.toString().trim())          errors.push('Name is required');
    if (!isValidPhone(row.phone))              errors.push('Valid 10-digit phone is required');
    if (row.email && !isValidEmail(row.email)) errors.push('Invalid email format');
    if (!VALID_LEAD_SOURCES.includes(row.source))
      errors.push(`Source must be one of: ${VALID_LEAD_SOURCES.join(', ')}`);
    if (row.status && !VALID_LEAD_STATUSES.includes(row.status))
      errors.push(`Status must be one of: ${VALID_LEAD_STATUSES.join(', ')}`);
    if (!row.agentEmail || !isValidEmail(row.agentEmail))
      errors.push('Valid agent email is required');
  
    return errors.length ? { row: rowNum, errors } : null;
  };
  
  // ── Clients ────────────────────────────────────────────────────────────────
  export const validateClientRow = (row: Record<string, any>, rowNum: number): RowError | null => {
    const errors: string[] = [];
  
    if (!row.name?.toString().trim())          errors.push('Name is required');
    if (!isValidPhone(row.phone))              errors.push('Valid 10-digit phone is required');
    if (row.email && !isValidEmail(row.email)) errors.push('Invalid email format');
    if (!row.agentEmail || !isValidEmail(row.agentEmail))
      errors.push('Valid agent email is required');
  
    return errors.length ? { row: rowNum, errors } : null;
  };
  
  // ── Payments ───────────────────────────────────────────────────────────────
  export const validatePaymentRow = (row: Record<string, any>, rowNum: number): RowError | null => {
    const errors: string[] = [];
  
    if (!row.clientPhone)   errors.push('Client phone is required');
    if (!row.bookingId)     errors.push('Booking ID is required');
    if (!row.amount || isNaN(Number(row.amount))) errors.push('Valid amount is required');
    if (!row.dueDate)       errors.push('Due date is required');
    if (!VALID_PAYMENT_STATUSES.includes(row.status))
      errors.push(`Status must be one of: ${VALID_PAYMENT_STATUSES.join(', ')}`);
    if (row.paymentMode && !VALID_PAYMENT_MODES.includes(row.paymentMode))
      errors.push(`Payment mode must be one of: ${VALID_PAYMENT_MODES.join(', ')}`);
    if (!row.agentEmail || !isValidEmail(row.agentEmail))
      errors.push('Valid agent email is required');
  
    return errors.length ? { row: rowNum, errors } : null;
  };
  
  // ── Projects ───────────────────────────────────────────────────────────────
  export const validateProjectRow = (row: Record<string, any>, rowNum: number): RowError | null => {
    const errors: string[] = [];
  
    if (!row.name?.toString().trim())     errors.push('Project name is required');
    if (!row.location?.toString().trim()) errors.push('Location is required');
    if (!row.totalUnits || isNaN(Number(row.totalUnits))) errors.push('Valid total units count is required');
    if (!VALID_PROJECT_STATUSES.includes(row.status))
      errors.push(`Status must be one of: ${VALID_PROJECT_STATUSES.join(', ')}`);
  
    return errors.length ? { row: rowNum, errors } : null;
  };
  
  // ── Units ──────────────────────────────────────────────────────────────────
  export const validateUnitRow = (row: Record<string, any>, rowNum: number): RowError | null => {
    const errors: string[] = [];
  
    if (!row.projectName?.toString().trim()) errors.push('Project name is required');
    if (!row.unitNumber?.toString().trim())  errors.push('Unit number is required');
    if (!VALID_UNIT_TYPES.includes(row.type))
      errors.push(`Type must be one of: ${VALID_UNIT_TYPES.join(', ')}`);
    if (!row.area || isNaN(Number(row.area)))   errors.push('Valid area is required');
    if (!row.price || isNaN(Number(row.price))) errors.push('Valid price is required');
    if (!VALID_UNIT_STATUSES.includes(row.status))
      errors.push(`Status must be one of: ${VALID_UNIT_STATUSES.join(', ')}`);
  
    return errors.length ? { row: rowNum, errors } : null;
  };