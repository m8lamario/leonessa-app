export type LeagueConditions = {
  minLevel?: number;
  schoolRequired?: boolean;
};

export type LeagueEnrollmentStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";

export type EnrollmentIssue =
  | "NOT_PUBLISHED"
  | "ENROLLMENT_CLOSED"
  | "LEAGUE_ENDED"
  | "MIN_LEVEL"
  | "SCHOOL_REQUIRED";

export type EnrollmentInput = {
  status: LeagueEnrollmentStatus;
  enrollmentOpen: boolean;
  endAt: Date;
  now: Date;
  conditions?: LeagueConditions | null;
  userLevel: number;
  schoolId: string | null;
};

export const ENROLLMENT_ISSUE_MESSAGE: Record<EnrollmentIssue, string> = {
  NOT_PUBLISHED: "Questa lega non è disponibile.",
  ENROLLMENT_CLOSED: "Le iscrizioni sono chiuse.",
  LEAGUE_ENDED: "La lega è terminata.",
  MIN_LEVEL: "Livello insufficiente per iscriversi.",
  SCHOOL_REQUIRED: "Serve una scuola associata per iscriversi.",
};

export function parseConditions(raw: unknown): LeagueConditions {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return {};
  }

  const source = raw as Record<string, unknown>;
  const conditions: LeagueConditions = {};

  if (typeof source.minLevel === "number" && Number.isInteger(source.minLevel) && source.minLevel > 0) {
    conditions.minLevel = source.minLevel;
  }

  if (typeof source.schoolRequired === "boolean") {
    conditions.schoolRequired = source.schoolRequired;
  }

  return conditions;
}

export function getEnrollmentIssue(input: EnrollmentInput): EnrollmentIssue | null {
  if (input.status !== "PUBLISHED") {
    return "NOT_PUBLISHED";
  }

  if (!input.enrollmentOpen) {
    return "ENROLLMENT_CLOSED";
  }

  if (input.now > input.endAt) {
    return "LEAGUE_ENDED";
  }

  if (input.conditions?.schoolRequired && !input.schoolId) {
    return "SCHOOL_REQUIRED";
  }

  if (input.conditions?.minLevel && input.userLevel < input.conditions.minLevel) {
    return "MIN_LEVEL";
  }

  return null;
}

export function getDisplayStatus(startAt: Date, endAt: Date, now: Date): "upcoming" | "live" | "ended" {
  if (now < startAt) return "upcoming";
  if (now > endAt) return "ended";
  return "live";
}

export function remainingMs(endAt: Date, now: Date) {
  return Math.max(0, endAt.getTime() - now.getTime());
}

export function slugifyName(name: string) {
  const slug = name
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);

  return slug || "partner";
}
