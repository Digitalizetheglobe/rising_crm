export const FEEDBACK_RATINGS = [1, 2, 3, 4, 5] as const;

export const FEEDBACK_CATEGORIES = [
    'SERVICE',
    'PROPERTY',
    'STAFF',
    'PRICING',
    'SITE_VISIT',
    'OTHER',
] as const;

export const FEEDBACK_STATUSES = [
    'OPEN',
    'ACKNOWLEDGED',
    'RESOLVED',
] as const;

export type FeedbackRating = typeof FEEDBACK_RATINGS[number];
export type FeedbackCategory = typeof FEEDBACK_CATEGORIES[number];
export type FeedbackStatus = typeof FEEDBACK_STATUSES[number];