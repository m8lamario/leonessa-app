export const MATCH_START_NOTIFICATION_TYPE = "MATCH_START" as const;

export const PUSH_PLATFORMS = ["android", "ios", "web"] as const;
export type PushPlatform = (typeof PUSH_PLATFORMS)[number];

export const DELIVERY_STATUS = {
  SENT: "SENT",
  FAILED: "FAILED",
  SKIPPED: "SKIPPED",
  DRY_RUN: "DRY_RUN",
} as const;

export type DeliveryStatus = (typeof DELIVERY_STATUS)[keyof typeof DELIVERY_STATUS];
