export const PROJECT_STATUSES = ['UPCOMING', 'ACTIVE', 'COMPLETED', 'ON_HOLD'] as const;

export const PROJECT_TYPES = ['RESIDENTIAL', 'COMMERCIAL', 'MIXED_USE', 'PLOTTED'] as const;

export type ProjectStatus = typeof PROJECT_STATUSES[number];
export type ProjectType = typeof PROJECT_TYPES[number];