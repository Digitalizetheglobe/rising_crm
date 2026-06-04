export const LOAN_STATUSES = [
    'Applied',
    'Under Review',
    'Approved',
    'Rejected',
    'Disbursed',
    'Closed',
  ] as const;
  export type LoanStatus = (typeof LOAN_STATUSES)[number];
  
  // Valid forward-only status transitions
  export const VALID_LOAN_TRANSITIONS: Record<string, string[]> = {
    Applied:       ['Under Review', 'Rejected'],
    'Under Review':['Approved', 'Rejected'],
    Approved:      ['Disbursed', 'Rejected'],
    Rejected:      [],   // terminal
    Disbursed:     ['Closed'],
    Closed:        [],   // terminal
  };