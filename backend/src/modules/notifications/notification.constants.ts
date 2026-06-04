export const NOTIFICATION_TYPES = [
    'Lead',
    'FollowUp',
    'Payment',
    'SiteVisit',
    'General',
  ] as const;
  export type NotificationType = (typeof NOTIFICATION_TYPES)[number];
  
  export const NOTIFICATION_REF_MODELS = [
    'Lead',
    'FollowUp',
    'Payment',
    'Booking',
    'Loan',
    'Client',
    'Enquiry',
    'User',
  ] as const;
  export type NotificationRefModel = (typeof NOTIFICATION_REF_MODELS)[number];