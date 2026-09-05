export const MATCH_START_NOTIFICATION_TYPE = "MATCH_START" as const;
export const SOCIAL_LP_OVERTAKE_TYPE = "LP_OVERTAKE" as const;

export const SOCIAL_EVENT_TYPES = {
  LP_OVERTAKE: SOCIAL_LP_OVERTAKE_TYPE,
  NEW_FOLLOWER: "NEW_FOLLOWER",
  FRIEND_BADGE: "FRIEND_BADGE",
  RANKING_OVERTAKE: "RANKING_OVERTAKE",
  FEATURED_ACHIEVEMENT: "FEATURED_ACHIEVEMENT",
} as const;

export const PUSH_PLATFORMS = ["android", "ios", "web"] as const;
export type PushPlatform = (typeof PUSH_PLATFORMS)[number];

export const DELIVERY_STATUS = {
  SENT: "SENT",
  FAILED: "FAILED",
  SKIPPED: "SKIPPED",
  DRY_RUN: "DRY_RUN",
} as const;

export type DeliveryStatus = (typeof DELIVERY_STATUS)[keyof typeof DELIVERY_STATUS];
