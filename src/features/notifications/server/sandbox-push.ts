import "server-only";

import { isSandboxMode } from "@/lib/sandbox";
import { prisma } from "@/lib/prisma";
import { AppError } from "@/utils/errors";

import { listFollowersForMatch } from "./follow-service";
import { notifyMatchStarted } from "./notification-service";

/**
 * Sandbox-only: simulate match-started push without mutating a real match schedule.
 */
export async function simulateMatchStartedPush(userId: string, matchId?: string) {
  if (!isSandboxMode()) {
    throw new AppError("FORBIDDEN", "Simulazione disponibile solo in Sandbox.", 403);
  }

  const match = matchId
    ? await prisma.match.findFirst({
        where: { id: matchId, deletedAt: null },
        select: {
          id: true,
          startAt: true,
          homeTeam: { select: { name: true } },
          awayTeam: { select: { name: true } },
        },
      })
    : await prisma.match.findFirst({
        where: {
          deletedAt: null,
          OR: [
            { followedBy: { some: { userId } } },
            { status: { in: ["SCHEDULED", "LIVE"] } },
          ],
        },
        select: {
          id: true,
          startAt: true,
          homeTeam: { select: { name: true } },
          awayTeam: { select: { name: true } },
        },
        orderBy: { startAt: "asc" },
      });

  if (!match) {
    throw new AppError("NOT_FOUND", "Nessuna partita disponibile per la simulazione.", 404);
  }

  const followers = await listFollowersForMatch(match.id);
  const recipientIds = followers.some((f) => f.userId === userId)
    ? followers.map((f) => f.userId)
    : [userId, ...followers.map((f) => f.userId)];

  const result = await notifyMatchStarted(
    {
      matchId: match.id,
      startAt: match.startAt,
      homeTeam: match.homeTeam.name,
      awayTeam: match.awayTeam.name,
    },
    recipientIds,
    { dryRun: true },
  );

  return {
    matchId: match.id,
    homeTeam: match.homeTeam.name,
    awayTeam: match.awayTeam.name,
    recipients: recipientIds.length,
    ...result,
  };
}

export async function getPushDebugSnapshot(userId: string) {
  if (!isSandboxMode()) {
    throw new AppError("FORBIDDEN", "Debug disponibile solo in Sandbox.", 403);
  }

  const [devices, follows, deliveries] = await Promise.all([
    prisma.pushDevice.findMany({
      where: { userId },
      select: {
        id: true,
        platform: true,
        enabled: true,
        token: true,
        lastSeenAt: true,
        revokedAt: true,
      },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.followedMatch.findMany({
      where: { userId },
      select: {
        matchId: true,
        createdAt: true,
        match: {
          select: {
            startAt: true,
            status: true,
            homeTeam: { select: { name: true } },
            awayTeam: { select: { name: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    prisma.notificationDelivery.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: {
        id: true,
        idempotencyKey: true,
        matchId: true,
        notificationType: true,
        status: true,
        error: true,
        createdAt: true,
        sentAt: true,
      },
    }),
  ]);

  return {
    userId,
    devices: devices.map((d) => ({
      ...d,
      token: `${d.token.slice(0, 6)}…${d.token.slice(-4)}`,
    })),
    followedMatches: follows,
    deliveries,
  };
}
