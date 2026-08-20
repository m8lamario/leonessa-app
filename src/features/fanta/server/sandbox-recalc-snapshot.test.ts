import { readFileSync, existsSync } from "node:fs";
import { afterAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";

function loadEnvFiles() {
  for (const file of [".env.local", ".env"]) {
    if (!existsSync(file)) continue;
    for (const line of readFileSync(file, "utf8").split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq <= 0) continue;
      const key = trimmed.slice(0, eq).trim();
      let value = trimmed.slice(eq + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (process.env[key] === undefined) process.env[key] = value;
    }
  }
}

loadEnvFiles();
process.env.APP_SANDBOX_MODE = "true";

const prisma = new PrismaClient();

async function sandboxReady() {
  if (!process.env.DATABASE_URL) return false;
  try {
    const competition = await prisma.competition.findUnique({
      where: { slug: "leonessa-cup-sandbox" },
      select: { id: true },
    });
    if (!competition) return false;
    const teams = await prisma.fantasyTeam.count({
      where: { user: { email: { startsWith: "sandbox-user-" } } },
    });
    return teams > 0;
  } catch {
    return false;
  }
}

const ready = await sandboxReady();

describe.skipIf(!ready)("recalculateSandbox transaction-aware snapshots", () => {
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("returns AFTER that matches committed FantasyPlayerStat and stays idempotent", async () => {
    const { recalculateSandbox } = await import("../server/sandbox-recalc-service");

    const competition = await prisma.competition.findUniqueOrThrow({
      where: { slug: "leonessa-cup-sandbox" },
      select: { id: true },
    });
    const teams = await prisma.team.findMany({
      where: { competitionId: competition.id, deletedAt: null },
      take: 2,
      orderBy: { name: "asc" },
    });
    expect(teams.length).toBeGreaterThanOrEqual(2);

    const home = teams[0]!;
    const away = teams[1]!;
    const scorer = await prisma.teamMember.findFirstOrThrow({
      where: {
        teamId: home.id,
        role: "PLAYER",
        leftAt: null,
        fantasySelections: { some: { fantasyTeam: { user: { email: { startsWith: "sandbox-user-" } } } } },
      },
      select: { id: true },
    });

    const match = await prisma.match.create({
      data: {
        competitionId: competition.id,
        homeTeamId: home.id,
        awayTeamId: away.id,
        startAt: new Date("2099-12-15T15:00:00.000Z"),
        status: "FINISHED",
        homeScore: 1,
        awayScore: 0,
      },
    });
    await prisma.matchEvent.create({
      data: { matchId: match.id, type: "GOAL", minute: 12, playerId: scorer.id },
    });

    const first = await recalculateSandbox(match.id);
    const firstPersisted = await prisma.fantasyPlayerStat.findUniqueOrThrow({
      where: { playerId: scorer.id },
      select: { totalPoints: true },
    });
    expect(first.after.playerPoints[scorer.id]).toBe(firstPersisted.totalPoints);

    await prisma.matchEvent.create({
      data: { matchId: match.id, type: "ASSIST", minute: 13, playerId: scorer.id },
    });

    const second = await recalculateSandbox(match.id);
    const secondPersisted = await prisma.fantasyPlayerStat.findUniqueOrThrow({
      where: { playerId: scorer.id },
      select: { totalPoints: true },
    });

    // AFTER must see in-transaction writes (regression for global-prisma snapshot).
    expect(second.after.playerPoints[scorer.id]).toBe(secondPersisted.totalPoints);
    expect(second.after.playerPoints[scorer.id]).toBeGreaterThan(
      second.before.playerPoints[scorer.id] ?? 0,
    );
    expect(second.after.playerPoints[scorer.id]).toBeGreaterThan(
      first.after.playerPoints[scorer.id] ?? 0,
    );

    const third = await recalculateSandbox(match.id);
    const thirdPersisted = await prisma.fantasyPlayerStat.findUniqueOrThrow({
      where: { playerId: scorer.id },
      select: { totalPoints: true },
    });
    expect(third.after.playerPoints[scorer.id]).toBe(thirdPersisted.totalPoints);
    expect(third.after.playerPoints[scorer.id]).toBe(second.after.playerPoints[scorer.id]);
    expect(third.before.playerPoints[scorer.id]).toBe(second.after.playerPoints[scorer.id]);
  }, 60_000);
});
