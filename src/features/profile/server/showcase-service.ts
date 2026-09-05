import "server-only";

import { prisma } from "@/lib/prisma";
import { ACHIEVEMENTS } from "@/features/fanta/achievements";
import { getLevelProgress } from "@/features/rewards/levels";
import { getUserPredictionStats } from "@/features/predictions/server";
import { AppError } from "@/utils/errors";

import { formatUserInitials, formatUserName } from "../lib/identity";
import type { UserShowcase } from "../types/profile";

const LEONESSA_CUP_SLUG = "leonessa-cup";

const dateFormatter = new Intl.DateTimeFormat("it-IT", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  timeZone: "Europe/Rome",
});

function formatDate(date: Date) {
  return dateFormatter.format(date).replace(".", "");
}

async function getLpRank(userId: string, balance: number) {
  const record = await prisma.userLPBalance.findUnique({
    where: { userId },
    select: { createdAt: true },
  });
  const higher = await prisma.userLPBalance.count({
    where: {
      balance: { gt: balance },
      user: { deletedAt: null },
    },
  });
  const sameCreatedEarlier = record
    ? await prisma.userLPBalance.count({
        where: {
          userId: { not: userId },
          balance,
          user: { deletedAt: null },
          createdAt: { lt: record.createdAt },
        },
      })
    : 0;
  return higher + sameCreatedEarlier + 1;
}

async function getFantaStanding(userId: string) {
  const team = await prisma.fantasyTeam.findUnique({
    where: { userId },
    select: { id: true, totalPoints: true, createdAt: true },
  });
  if (!team) return { points: null, position: null };

  const ahead = await prisma.fantasyTeam.count({
    where: {
      OR: [
        { totalPoints: { gt: team.totalPoints } },
        { totalPoints: team.totalPoints, createdAt: { lt: team.createdAt } },
      ],
    },
  });

  return { points: team.totalPoints, position: ahead + 1 };
}

export async function getUserShowcase(userId: string): Promise<UserShowcase | null> {
  const user = await prisma.user.findFirst({
    where: { id: userId, deletedAt: null },
    select: {
      id: true,
      name: true,
      surname: true,
      image: true,
      bio: true,
      schoolId: true,
      school: { select: { name: true } },
      lpBalance: { select: { balance: true } },
    },
  });

  if (!user) return null;

  const totalLp = user.lpBalance?.balance ?? 0;
  const progress = getLevelProgress(totalLp);
  const competition = await prisma.competition.findUnique({
    where: { slug: LEONESSA_CUP_SLUG },
    select: { id: true },
  });

  const [
    rankingPosition,
    fanta,
    earnedBadges,
    missionsCompleted,
    eventsAttended,
    referralsCompleted,
    predictionStats,
    schoolRank,
    followerCount,
    followingCount,
    unlockedAchievements,
    completedMissions,
  ] = await Promise.all([
    getLpRank(user.id, totalLp),
    getFantaStanding(user.id),
    prisma.userBadge.findMany({
      where: { userId: user.id, badge: { deletedAt: null, active: true } },
      select: {
        earnedAt: true,
        badge: { select: { id: true, name: true, description: true } },
      },
      orderBy: { earnedAt: "desc" },
    }),
    prisma.userMission.count({
      where: { userId: user.id, status: { in: ["COMPLETED", "CLAIMED"] } },
    }),
    prisma.eventAttendance.count({ where: { userId: user.id } }),
    prisma.referral.count({ where: { referrerId: user.id, status: "COMPLETED" } }),
    getUserPredictionStats(user.id),
    competition?.id && user.schoolId
      ? prisma.schoolRanking.findMany({
          where: { competitionId: competition.id },
          select: { schoolId: true, totalPoints: true, wins: true, draws: true, losses: true },
          orderBy: [{ totalPoints: "desc" }, { wins: "desc" }, { draws: "desc" }, { losses: "asc" }],
        })
      : Promise.resolve([]),
    prisma.userFollow.count({ where: { followingId: user.id, follower: { deletedAt: null } } }),
    prisma.userFollow.count({ where: { followerId: user.id, following: { deletedAt: null } } }),
    prisma.fantasyAchievement.findMany({
      where: { userId: user.id },
      select: { code: true, unlockedAt: true },
      orderBy: { unlockedAt: "desc" },
    }),
    prisma.userMission.findMany({
      where: { userId: user.id, status: { in: ["COMPLETED", "CLAIMED"] } },
      select: {
        id: true,
        completedAt: true,
        claimedAt: true,
        mission: { select: { title: true } },
      },
      orderBy: { completedAt: "desc" },
      take: 5,
    }),
  ]);

  const schoolIndex = user.schoolId
    ? schoolRank.findIndex((entry) => entry.schoolId === user.schoolId)
    : -1;
  const badges = earnedBadges.map((entry) => ({
    id: entry.badge.id,
    name: entry.badge.name,
    description: entry.badge.description,
    earnedAt: formatDate(entry.earnedAt),
  }));

  const achievements = unlockedAchievements.flatMap((row) => {
    const catalog = ACHIEVEMENTS[row.code as keyof typeof ACHIEVEMENTS];
    if (!catalog) return [];
    return [
      {
        code: catalog.code,
        title: catalog.title,
        description: catalog.description,
        unlockedAt: formatDate(row.unlockedAt),
      },
    ];
  });

  const recentActivity = [
    ...earnedBadges.map((entry) => ({
      id: `badge-${entry.badge.id}`,
      title: `Ha ottenuto il badge ${entry.badge.name}`,
      detail: entry.badge.description,
      occurredAt: entry.earnedAt.toISOString(),
    })),
    ...unlockedAchievements.map((row) => {
      const catalog = ACHIEVEMENTS[row.code as keyof typeof ACHIEVEMENTS];
      return {
        id: `achievement-${row.code}`,
        title: `Ha sbloccato ${catalog?.title ?? "un achievement Fanta"}`,
        detail: catalog?.description ?? null,
        occurredAt: row.unlockedAt.toISOString(),
      };
    }),
    ...completedMissions.flatMap((row) => {
      const occurredAt = row.completedAt ?? row.claimedAt;
      if (!occurredAt) return [];
      return [
        {
          id: `mission-${row.id}`,
          title: `Ha completato ${row.mission.title}`,
          detail: null,
          occurredAt: occurredAt.toISOString(),
        },
      ];
    }),
  ]
    .sort((left, right) => new Date(right.occurredAt).getTime() - new Date(left.occurredAt).getTime())
    .slice(0, 4);

  return {
    id: user.id,
    name: formatUserName(user),
    initials: formatUserInitials(user),
    image: user.image,
    bio: user.bio?.trim() || null,
    schoolName: user.school?.name ?? null,
    schoolRank: schoolIndex >= 0 ? schoolIndex + 1 : null,
    level: progress.level,
    levelProgressPercent: progress.progressPercent,
    currentLP: progress.currentLP,
    nextLevelLP: progress.nextLevelLP,
    totalLp,
    rankingPosition,
    fantaPoints: fanta.points,
    fantaPosition: fanta.position,
    badges,
    badgeCount: badges.length,
    missionsCompleted,
    eventsAttended,
    referralsCompleted,
    predictionPercent: predictionStats.percent,
    predictionSettled: predictionStats.settled,
    followerCount,
    followingCount,
    achievements,
    recentActivity,
  };
}

export async function requireUserShowcase(userId: string) {
  const showcase = await getUserShowcase(userId);
  if (!showcase) {
    throw new AppError("NOT_FOUND", "Profilo non trovato.", 404);
  }
  return showcase;
}

export { buildProfileComparison, buildShowcaseStats } from "../lib/showcase";
