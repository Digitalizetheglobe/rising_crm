export const CLIENT_STATUSES = ['ACTIVE', 'INACTIVE', 'BLACKLISTED'] as const;

export type ClientStatus = typeof CLIENT_STATUSES[number];
