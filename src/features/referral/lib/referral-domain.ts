import { randomBytes } from "node:crypto";

export const REFERRAL_CODE_LENGTH = 12;
export const REFERRAL_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
export const REFERRAL_DEVICE_COOKIE = "leonessa_referral_device";

export type ReferralCompletionEvent = string;
export type ReferralAttributionIssue = "INVALID_CODE" | "SELF_REFERRAL" | "ALREADY_ATTRIBUTED";

export function generateReferralCode(
  bytes: Uint8Array = randomBytes(REFERRAL_CODE_LENGTH),
): string {
  if (bytes.length < REFERRAL_CODE_LENGTH) {
    throw new RangeError(`Servono almeno ${REFERRAL_CODE_LENGTH} byte casuali.`);
  }

  return Array.from(bytes.slice(0, REFERRAL_CODE_LENGTH), (byte) => {
    return REFERRAL_CODE_ALPHABET[byte % REFERRAL_CODE_ALPHABET.length];
  }).join("");
}

export function normalizeReferralCode(value: string | null | undefined): string | null {
  const normalized = value?.trim().toUpperCase() ?? "";
  return normalized || null;
}

export function buildReferralLink(appUrl: string, code: string): string {
  const url = new URL("/register", appUrl);
  url.searchParams.set("ref", normalizeReferralCode(code) ?? code);
  return url.toString();
}

export function getReferralRewardKeys(referralId: string) {
  return {
    referrer: `referral:${referralId}:referrer`,
    invitee: `referral:${referralId}:invitee`,
  };
}

export function isSameDeviceReferral(input: {
  referredDeviceHash: string | null;
  referrerDeviceHashes: ReadonlySet<string>;
}) {
  return Boolean(
    input.referredDeviceHash && input.referrerDeviceHashes.has(input.referredDeviceHash),
  );
}

export function getReferralAttributionIssue(input: {
  codeOwnerId: string | null;
  codeOwnerEmail: string | null;
  referredUserId: string;
  referredEmail: string;
  hasExistingReferral: boolean;
}): ReferralAttributionIssue | null {
  if (!input.codeOwnerId || !input.codeOwnerEmail) return "INVALID_CODE";
  if (
    input.codeOwnerId === input.referredUserId ||
    input.codeOwnerEmail.toLowerCase() === input.referredEmail.toLowerCase()
  ) {
    return "SELF_REFERRAL";
  }
  if (input.hasExistingReferral) return "ALREADY_ATTRIBUTED";
  return null;
}

export function getReferralCompletionOutcome(status: "PENDING" | "COMPLETED" | "BLOCKED") {
  if (status === "BLOCKED") return "BLOCKED" as const;
  if (status === "COMPLETED") return "ALREADY_COMPLETED" as const;
  return "COMPLETE" as const;
}
