export const APPLICATION_ROLES = [
  "USER",
  "PLAYER",
  "STAFF",
  "SCHOOL_REP",
  "ORGANIZER",
  "ADMIN",
] as const;

export const ONBOARDING_ROLES = ["USER", "PLAYER", "STAFF", "SCHOOL_REP", "ORGANIZER"] as const;

export type ApplicationRole = (typeof APPLICATION_ROLES)[number];
export type OnboardingRole = (typeof ONBOARDING_ROLES)[number];
