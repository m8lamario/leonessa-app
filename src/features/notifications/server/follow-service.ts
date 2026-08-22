import "server-only";

import { prisma } from "@/lib/prisma";
import { AppError } from "@/utils/errors";

import { evaluateFollowEligibility } from "../lib/follow-eligibility";

async function getFollowableMatch(matchId: string) {
  const match = await prisma.match.findFirst({
    where: {
      id: matchId,
      deletedAt: null,
      competition: { deletedAt: null },
    },
    select: {
      id: true,
      status: true,
      startAt: true,
      competitionId: true,
      homeTeam: { select: { name: true } },
      awayTeam: { select: { name: true } },
    },
  });

  if (!match) {
    throw new AppError("NOT_FOUND", "Partita inesistente.", 404);
  }

  return match;
}

export async function isFollowingMatch(userId: string, matchId: string) {
  const row = await prisma.followedMatch.findUnique({
    where: { userId_matchId: { userId, matchId } },
    select: { id: true },
  });
  return Boolean(row);
}

export async function getMatchFollowState(userId: string, matchId: string) {
  const match = await getFollowableMatch(matchId);
  const following = await isFollowingMatch(userId, match.id);
  const eligibility = evaluateFollowEligibility({
    status: match.status,
    startAt: match.startAt,
  });
  const canFollow = eligibility.allowed && !following;

  return {
    matchId: match.id,
    following,
    canFollow,
    status: match.status,
    startAt: match.startAt.toISOString(),
    homeTeam: match.homeTeam.name,
    awayTeam: match.awayTeam.name,
  };
}

export async function followMatch(userId: string, matchId: string) {
  const match = await getFollowableMatch(matchId);
  const eligibility = evaluateFollowEligibility({
    status: match.status,
    startAt: match.startAt,
  });
  if (!eligibility.allowed) {
    throw new AppError("BAD_REQUEST", eligibility.reason ?? "Follow non consentito.", 400);
  }

  const existing = await prisma.followedMatch.findUnique({
    where: { userId_matchId: { userId, matchId: match.id } },
  });
  if (existing) {
    return { following: true, created: false, matchId: match.id };
  }

  await prisma.followedMatch.create({
    data: { userId, matchId: match.id },
  });

  return { following: true, created: true, matchId: match.id };
}

export async function unfollowMatch(userId: string, matchId: string) {
  await getFollowableMatch(matchId);

  const deleted = await prisma.followedMatch.deleteMany({
    where: { userId, matchId },
  });

  return { following: false, removed: deleted.count > 0, matchId };
}

export async function listFollowersForMatch(matchId: string) {
  return prisma.followedMatch.findMany({
    where: { matchId },
    select: { userId: true },
  });
}
