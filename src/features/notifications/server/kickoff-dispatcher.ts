import "server-only";

import { logger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";

import { listFollowersForMatch } from "./follow-service";
import { notifyMatchStarted } from "./notification-service";

const KICKOFF_LOOKBACK_MS = 15 * 60 * 1000;
const KICKOFF_AHEAD_MS = 30 * 1000;

/**
 * Server-side poller: finds followed matches whose startAt has passed and
 * dispatches MATCH_START pushes (idempotent).
 */
export async function dispatchDueMatchStartNotifications(now = new Date()) {
  const from = new Date(now.getTime() - KICKOFF_LOOKBACK_MS);
  const to = new Date(now.getTime() + KICKOFF_AHEAD_MS);

  const matches = await prisma.match.findMany({
    where: {
      deletedAt: null,
      status: { in: ["SCHEDULED", "LIVE"] },
      startAt: { gte: from, lte: to },
      followedBy: { some: {} },
    },
    select: {
      id: true,
      startAt: true,
      status: true,
      homeTeam: { select: { name: true } },
      awayTeam: { select: { name: true } },
    },
    take: 50,
  });

  let processed = 0;
  const totals = { sent: 0, failed: 0, skipped: 0, dryRun: 0 };

  for (const match of matches) {
    if (match.startAt.getTime() > now.getTime()) continue;

    const followers = await listFollowersForMatch(match.id);
    if (followers.length === 0) continue;

    const result = await notifyMatchStarted(
      {
        matchId: match.id,
        startAt: match.startAt,
        homeTeam: match.homeTeam.name,
        awayTeam: match.awayTeam.name,
      },
      followers.map((f) => f.userId),
    );

    totals.sent += result.sent;
    totals.failed += result.failed;
    totals.skipped += result.skipped;
    totals.dryRun += result.dryRun;
    processed += 1;

    if (match.status === "SCHEDULED") {
      await prisma.match.update({
        where: { id: match.id },
        data: { status: "LIVE" },
      });
    }
  }

  if (processed > 0) {
    logger.info({ processed, ...totals }, "Kickoff notification dispatch completed");
  }

  return { processed, ...totals };
}
