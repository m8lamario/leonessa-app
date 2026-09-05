import { describe, expect, it } from "vitest";

import { getEnrollmentIssue, parseConditions, slugifyName } from "./enrollment";

const now = new Date("2026-09-15T12:00:00.000Z");
const endAt = new Date("2026-09-30T00:00:00.000Z");

const valid = {
  status: "PUBLISHED" as const,
  enrollmentOpen: true,
  endAt,
  now,
  userLevel: 4,
  schoolId: "school-1",
  conditions: null,
};

describe("league enrollment", () => {
  it("allows a published open league before the end date", () => {
    expect(getEnrollmentIssue(valid)).toBeNull();
  });

  it("rejects draft, closed, ended, missing school and low level", () => {
    expect(getEnrollmentIssue({ ...valid, status: "DRAFT" })).toBe("NOT_PUBLISHED");
    expect(getEnrollmentIssue({ ...valid, enrollmentOpen: false })).toBe("ENROLLMENT_CLOSED");
    expect(getEnrollmentIssue({ ...valid, now: new Date("2026-10-01T00:00:00.000Z") })).toBe(
      "LEAGUE_ENDED",
    );
    expect(
      getEnrollmentIssue({
        ...valid,
        schoolId: null,
        conditions: { schoolRequired: true },
      }),
    ).toBe("SCHOOL_REQUIRED");
    expect(getEnrollmentIssue({ ...valid, userLevel: 2, conditions: { minLevel: 5 } })).toBe(
      "MIN_LEVEL",
    );
  });

  it("parses known condition keys and ignores the rest", () => {
    expect(parseConditions({ minLevel: 3, schoolRequired: true, extra: "nope" })).toEqual({
      minLevel: 3,
      schoolRequired: true,
    });
    expect(parseConditions("invalid")).toEqual({});
  });

  it("slugifies partner names", () => {
    expect(slugifyName("Bar Castelli")).toBe("bar-castelli");
    expect(slugifyName("  ")).toBe("partner");
  });
});
