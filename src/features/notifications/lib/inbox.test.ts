import { describe, expect, it } from "vitest";

import {
  mapInboxNotification,
  parseInboxReadPayload,
  sanitizeInboxLink,
} from "./inbox";

describe("inbox link sanitization", () => {
  it("keeps internal profile and explore paths", () => {
    expect(sanitizeInboxLink("/u/marco")).toBe("/u/marco");
    expect(sanitizeInboxLink("/altro/esplora?categoria=persone")).toBe(
      "/altro/esplora?categoria=persone",
    );
  });

  it("rejects open redirects and unsafe schemes", () => {
    expect(sanitizeInboxLink("https://evil.example/u/marco")).toBeNull();
    expect(sanitizeInboxLink("//evil.example")).toBeNull();
    expect(sanitizeInboxLink("/\\evil")).toBeNull();
    expect(sanitizeInboxLink("javascript:alert(1)")).toBeNull();
    expect(sanitizeInboxLink("/u/marco with space")).toBeNull();
  });
});

describe("inbox mapping", () => {
  it("maps unread social overtake notifications to a profile href", () => {
    const mapped = mapInboxNotification({
      id: "n1",
      type: "SOCIAL",
      title: "Marco ti ha superato!",
      body: "Marco ha 2.450 LP, tu ne hai 2.400.",
      linkUrl: "/u/marco",
      readAt: null,
      createdAt: new Date("2026-09-05T10:00:00.000Z"),
    });

    expect(mapped).toMatchObject({
      id: "n1",
      href: "/u/marco",
      read: false,
    });
  });

  it("drops unsafe stored links", () => {
    expect(
      mapInboxNotification({
        id: "n2",
        type: "SOCIAL",
        title: "Bad",
        body: "Bad",
        linkUrl: "https://evil.example",
        readAt: new Date("2026-09-05T10:00:00.000Z"),
        createdAt: new Date("2026-09-05T10:00:00.000Z"),
      }).href,
    ).toBeNull();
  });
});

describe("inbox read payload", () => {
  it("accepts a single id, a list, or mark-all", () => {
    expect(parseInboxReadPayload({ id: "n1" })).toEqual({ ids: ["n1"], all: false });
    expect(parseInboxReadPayload({ ids: ["n1", "n2"] })).toEqual({ ids: ["n1", "n2"], all: false });
    expect(parseInboxReadPayload({ all: true })).toEqual({ ids: [], all: true });
  });
});
