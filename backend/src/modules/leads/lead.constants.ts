export const LEAD_STATUSES = [
    'NEW',
    'CONTACTED',
    'QUALIFIED',
    'SITE_VISIT_SCHEDULED',
    'SITE_VISIT_COMPLETED',
    'INTERESTED',
    'NEGOTIATION',
    'BOOKING_IN_PROGRESS',
    'BOOKED',
    'PAYMENT_IN_PROGRESS',
    'CLOSED',
    'HOLD',
    'LOST',
    'DUPLICATE',
] as const;

export type LeadStatus = typeof LEAD_STATUSES[number];

export const LEAD_SOURCES = [
    'Facebook',
    'Google',
    'Website',
    'Walk-In',
    'MagicBricks',
    '99acres',
    'Referral',
    'Phone',
    'WhatsApp',
    'Email',
    'Social Media',
    'Advertisement',
    'Other',
] as const;

export type LeadSource = typeof LEAD_SOURCES[number];

export const LEAD_PRIORITIES = ['Low', 'Medium', 'High'] as const;
export type LeadPriority = typeof LEAD_PRIORITIES[number];

export const BUDGET_RANGES = [
    'Under 25L',
    '25L-50L',
    '50L-1Cr',
    '1Cr-2Cr',
    'Above 2Cr',
] as const;

export const PROPERTY_TYPES = [
    '1BHK',
    '2BHK',
    '3BHK',
    '4+BHK',
    'Villa',
    'Banglow',
    'Plot',
    'Residential',
    'Commercial',
    'Apartment',
    'Shop',
    'Office',
] as const;

// Which statuses count as "closed/terminal" — no further updates expected
export const TERMINAL_STATUSES: LeadStatus[] = ['CLOSED', 'LOST', 'DUPLICATE'];

// Valid forward transitions — prevents random status jumps
export const VALID_STATUS_TRANSITIONS: Record<LeadStatus, LeadStatus[]> = {
    NEW:                   ['CONTACTED', 'HOLD', 'LOST', 'DUPLICATE'],
    CONTACTED:             ['QUALIFIED', 'SITE_VISIT_SCHEDULED', 'HOLD', 'LOST'],
    QUALIFIED:             ['SITE_VISIT_SCHEDULED', 'NEGOTIATION', 'HOLD', 'LOST'],
    SITE_VISIT_SCHEDULED:  ['SITE_VISIT_COMPLETED', 'CONTACTED', 'HOLD', 'LOST'],
    SITE_VISIT_COMPLETED:  ['INTERESTED', 'NEGOTIATION', 'HOLD', 'LOST'],
    INTERESTED:            ['NEGOTIATION', 'BOOKING_IN_PROGRESS', 'HOLD', 'LOST'],
    NEGOTIATION:           ['BOOKING_IN_PROGRESS', 'INTERESTED', 'HOLD', 'LOST'],
    BOOKING_IN_PROGRESS:   ['BOOKED', 'NEGOTIATION', 'HOLD', 'LOST'],
    BOOKED:                ['PAYMENT_IN_PROGRESS', 'HOLD'],
    PAYMENT_IN_PROGRESS:   ['CLOSED', 'HOLD'],
    CLOSED:                [],
    HOLD:                  ['NEW', 'CONTACTED', 'QUALIFIED', 'NEGOTIATION', 'LOST'],
    LOST:                  [],
    DUPLICATE:             [],
};