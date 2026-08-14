export const APPLICATION_ROLES = [
  "USER",
  "PLAYER",
  "STAFF",
  "SCHOOL_REP",
  "ORGANIZER",
  "ADMIN",
] as const;

export type ApplicationRole = (typeof APPLICATION_ROLES)[number];
