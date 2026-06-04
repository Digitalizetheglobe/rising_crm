export const CALL_OUTCOMES = [
    'ANSWERED',
    'NO_ANSWER',
    'BUSY',
    'VOICEMAIL',
    'CALLBACK_REQUESTED',
    'WRONG_NUMBER',
] as const;

export const CALL_DIRECTIONS = ['INBOUND', 'OUTBOUND'] as const;

export const CALL_PURPOSES = [
    'FOLLOW_UP',
    'SITE_VISIT_CONFIRMATION',
    'PAYMENT_REMINDER',
    'FEEDBACK',
    'GENERAL_INQUIRY',
    'OTHER',
] as const;

export type CallOutcome = typeof CALL_OUTCOMES[number];
export type CallDirection = typeof CALL_DIRECTIONS[number];
export type CallPurpose = typeof CALL_PURPOSES[number];