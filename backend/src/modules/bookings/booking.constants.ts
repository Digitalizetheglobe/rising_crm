export const BOOKING_TYPES = ['Full Payment', 'Instalment', 'Loan'] as const;
export type BookingType = (typeof BOOKING_TYPES)[number];

export const BOOKING_STATUSES = [
  'Active',
  'Cancelled',
  'Completed',
] as const;
export type BookingStatus = (typeof BOOKING_STATUSES)[number];

export const PAYMENT_MODES = [
  'Cash',
  'Cheque',
  'Bank Transfer',
  'UPI',
  'DD',
  'Online',
] as const;
export type PaymentMode = (typeof PAYMENT_MODES)[number];