export const PAYMENT_STATUSES = ['Pending', 'Paid', 'Overdue', 'Waived'] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const PAYMENT_MODES = [
  'Cash',
  'Cheque',
  'Bank Transfer',
  'UPI',
  'DD',
  'Online',
] as const;
export type PaymentMode = (typeof PAYMENT_MODES)[number];

export const PAYMENT_TYPES = [
  'Booking Amount',
  'Instalment',
  'Down Payment',
  'Final Payment',
  'Maintenance',
  'Other',
] as const;
export type PaymentType = (typeof PAYMENT_TYPES)[number];   