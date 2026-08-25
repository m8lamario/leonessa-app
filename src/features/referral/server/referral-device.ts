import "server-only";

import { createHmac, randomBytes } from "node:crypto";

import { env } from "@/env";

export const REFERRAL_DEVICE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

export function createReferralDeviceToken() {
  return randomBytes(32).toString("base64url");
}

export function hashReferralDeviceToken(token: string) {
  return createHmac("sha256", env.AUTH_SECRET).update(token).digest("hex");
}
