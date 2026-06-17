export const META_WEBHOOK_ROUTES = {
  VERIFY: '/verify',
  RECEIVE: '/receive',
  UNMATCHED: '/unmatched',
} as const;

export const META_PLATFORMS = ['facebook', 'instagram'] as const;
export type MetaPlatform = typeof META_PLATFORMS[number];

export const META_WEBHOOK_STATUS = ['pending', 'resolved'] as const;
export type MetaWebhookStatus = typeof META_WEBHOOK_STATUS[number];
