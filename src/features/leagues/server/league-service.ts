import "server-only";

import { Prisma } from "@prisma/client";

import { getLevelForLP } from "@/features/rewards/levels";
import { formatUserInitials, formatUserName } from "@/features/profile/lib/identity";
import { prisma } from "@/lib/prisma";
import { AppError } from "@/utils/errors";

import {
  ENROLLMENT_ISSUE_MESSAGE,
  getDisplayStatus,
  getEnrollmentIssue,
  parseConditions,
  remainingMs,
  type EnrollmentIssue,
} from "../lib/enrollment";
import { rankMembers, scoreMembersByRule } from "../lib/scoring";
import type { LeagueBoardData, LeagueBoardEntry, LeagueCard } from "../types/leagues";

const leagueSelect = {
  id: true,
  name: true,
  description: true,
  imageUrl: true,
  startAt: true,
  endAt: true,
  status: true,
  enrollmentOpen: true,
  scoringRule: true,
  prizeTitle: true,
  prizeDescription: true,
  awardedPositions: true,
  conditionsText: true,
  conditions: true,
  partner: {
    select: { name: true, logoUrl: true },
  },
  members: {
    select: { userId: true, joinedAt: true },
  },
} satisfies Prisma.SponsorLeagueSelect;

type LeagueRecord = Prisma.SponsorLeagueGetPayload<{ select: typeof leagueSelect }>;

function isUniqueConstraintError(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

async function getUserLevelAndSchool(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      schoolId: true,
      lpBalance: { select: { balance: true } },
    },
  });

  return {
    schoolId: user?.schoolId ?? null,
    userLevel: getLevelForLP(user?.lpBalance?.balance ?? 0),
  };
}

async function scoreLeague(league: LeagueRecord) {
  if (league.members.length === 0) {
    return [];
  }

  const from = league.members.reduce((earliest, member) => {
    const start = league.startAt > member.joinedAt ? league.startAt : member.joinedAt;
    return start < earliest ? start : earliest;
  }, league.endAt);

  const transactions = await prisma.pointTransaction.findMany({
    where: {
      userId: { in: league.members.map((member) => member.userId) },
      type: "LP",
      amount: { gt: 0 },
      createdAt: { gte: from, lte: league.endAt },
    },
    select: { userId: true, amount: true, type: true, createdAt: true },
  });

  return rankMembers(
    scoreMembersByRule(
      league.scoringRule,
      league.members,
      { startAt: league.startAt, endAt: league.endAt },
      transactions,
    ),
  );
}

function toCard(
  league: LeagueRecord,
  input: {
    userId: string;
    now: Date;
    ranked: ReturnType<typeof rankMembers>;
    userLevel: number;
    schoolId: string | null;
  },
): LeagueCard {
  const membership = league.members.find((member) => member.userId === input.userId);
  const rankedSelf = membership
    ? input.ranked.find((entry) => entry.userId === input.userId)
    : undefined;
  const conditions = parseConditions(league.conditions);
  const issue: EnrollmentIssue | null = membership
    ? null
    : getEnrollmentIssue({
        status: league.status,
        enrollmentOpen: league.enrollmentOpen,
        endAt: league.endAt,
        now: input.now,
        conditions,
        userLevel: input.userLevel,
        schoolId: input.schoolId,
      });

  return {
    id: league.id,
    name: league.name,
    description: league.description,
    sponsorName: league.partner.name,
    sponsorLogoUrl: league.partner.logoUrl,
    imageUrl: league.imageUrl ?? league.partner.logoUrl,
    prizeTitle: league.prizeTitle,
    prizeDescription: league.prizeDescription,
    awardedPositions: league.awardedPositions,
    conditionsText: league.conditionsText,
    startAt: league.startAt.toISOString(),
    endAt: league.endAt.toISOString(),
    displayStatus: getDisplayStatus(league.startAt, league.endAt, input.now),
    enrollmentOpen: league.enrollmentOpen,
    participantCount: league.members.length,
    joined: Boolean(membership),
    rank: rankedSelf?.rank ?? null,
    score: rankedSelf?.score ?? null,
    remainingMs: remainingMs(league.endAt, input.now),
    canJoin: !membership && issue === null,
    joinBlockedReason: issue ? ENROLLMENT_ISSUE_MESSAGE[issue] : null,
  };
}

export async function getPublishedLeagues(userId: string): Promise<LeagueCard[]> {
  const now = new Date();
  const [{ schoolId, userLevel }, leagues] = await Promise.all([
    getUserLevelAndSchool(userId),
    prisma.sponsorLeague.findMany({
      where: { deletedAt: null, status: "PUBLISHED" },
      select: leagueSelect,
      orderBy: [{ startAt: "desc" }, { name: "asc" }],
    }),
  ]);

  const cards = await Promise.all(
    leagues.map(async (league) => {
      const ranked = await scoreLeague(league);
      return toCard(league, { userId, now, ranked, userLevel, schoolId });
    }),
  );

  return cards.sort((left, right) => {
    if (left.joined !== right.joined) return left.joined ? -1 : 1;
    const order = { live: 0, upcoming: 1, ended: 2 } as const;
    return order[left.displayStatus] - order[right.displayStatus];
  });
}

export async function getLeagueBoard(leagueId: string, userId: string): Promise<LeagueBoardData> {
  const now = new Date();
  const [league, { schoolId, userLevel }] = await Promise.all([
    prisma.sponsorLeague.findFirst({
      where: { id: leagueId, deletedAt: null, status: "PUBLISHED" },
      select: leagueSelect,
    }),
    getUserLevelAndSchool(userId),
  ]);

  if (!league) {
    throw new AppError("NOT_FOUND", "Lega non trovata.", 404);
  }

  const ranked = await scoreLeague(league);
  const card = toCard(league, { userId, now, ranked, userLevel, schoolId });

  if (ranked.length === 0) {
    return { league: card, entries: [], currentUser: null };
  }

  const users = await prisma.user.findMany({
    where: { id: { in: ranked.map((entry) => entry.userId) } },
    select: {
      id: true,
      name: true,
      surname: true,
      image: true,
      school: { select: { shortName: true, name: true } },
    },
  });
  const byId = new Map(users.map((user) => [user.id, user]));

  const entries: LeagueBoardEntry[] = ranked.map((entry) => {
    const user = byId.get(entry.userId);
    return {
      id: entry.userId,
      rank: entry.rank,
      name: formatUserName(user ?? {}),
      school: user?.school?.shortName ?? user?.school?.name ?? "—",
      initials: formatUserInitials(user ?? {}),
      image: user?.image ?? null,
      score: entry.score,
      isCurrentUser: entry.userId === userId,
    };
  });

  return {
    league: card,
    entries,
    currentUser: entries.find((entry) => entry.isCurrentUser) ?? null,
  };
}

export async function joinLeague(userId: string, leagueId: string) {
  const now = new Date();
  const [league, { schoolId, userLevel }] = await Promise.all([
    prisma.sponsorLeague.findFirst({
      where: { id: leagueId, deletedAt: null },
      select: {
        id: true,
        status: true,
        enrollmentOpen: true,
        endAt: true,
        conditions: true,
        members: {
          where: { userId },
          select: { id: true, joinedAt: true },
        },
      },
    }),
    getUserLevelAndSchool(userId),
  ]);

  if (!league) {
    throw new AppError("NOT_FOUND", "Lega non trovata.", 404);
  }

  const existing = league.members[0];
  if (existing) {
    return { joined: true, alreadyJoined: true, joinedAt: existing.joinedAt.toISOString() };
  }

  const issue = getEnrollmentIssue({
    status: league.status,
    enrollmentOpen: league.enrollmentOpen,
    endAt: league.endAt,
    now,
    conditions: parseConditions(league.conditions),
    userLevel,
    schoolId,
  });

  if (issue) {
    throw new AppError("BAD_REQUEST", ENROLLMENT_ISSUE_MESSAGE[issue], 400);
  }

  try {
    const member = await prisma.sponsorLeagueMember.create({
      data: { leagueId, userId },
      select: { joinedAt: true },
    });
    return { joined: true, alreadyJoined: false, joinedAt: member.joinedAt.toISOString() };
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      const member = await prisma.sponsorLeagueMember.findUnique({
        where: { leagueId_userId: { leagueId, userId } },
        select: { joinedAt: true },
      });
      return {
        joined: true,
        alreadyJoined: true,
        joinedAt: member?.joinedAt.toISOString() ?? now.toISOString(),
      };
    }
    throw error;
  }
}
