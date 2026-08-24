import "server-only";

import { getLevelProgress } from "@/features/rewards/levels";
import { prisma } from "@/lib/prisma";

import { partitionBadges, partitionMissions } from "../lib/hub-collections";
import { MISSION_STATUS_LABELS, type HubBadge, type HubData, type HubMission } from "../types";

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

export async function getHubData(userId: string, schoolId: string | null): Promise<HubData> {
  const [competition, balance] = await Promise.all([
    prisma.competition.findUnique({
      where: { slug: LEONESSA_CUP_SLUG },
      select: { id: true },
    }),
    prisma.userLPBalance.findUnique({
      where: { userId },
      select: { balance: true, lifetimeEarned: true },
    }),
  ]);

  const competitionId = competition?.id ?? null;
  const missionCompetitionFilter = competitionId
    ? { OR: [{ competitionId }, { competitionId: null }] }
    : { competitionId: null };
  const badgeCompetitionFilter = missionCompetitionFilter;

  const [userMissions, catalogBadges, userBadges, currentTeam] = await Promise.all([
    prisma.userMission.findMany({
      where: {
        userId,
        mission: {
          deletedAt: null,
          ...missionCompetitionFilter,
        },
      },
      select: {
        id: true,
        progress: true,
        status: true,
        completedAt: true,
        mission: { select: { title: true, description: true, rewardPoints: true } },
      },
      orderBy: { createdAt: "asc" },
    }),
    prisma.badge.findMany({
      where: {
        deletedAt: null,
        active: true,
        ...badgeCompetitionFilter,
      },
      select: { id: true, name: true, description: true, iconUrl: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.userBadge.findMany({
      where: { userId },
      select: { badgeId: true, earnedAt: true },
    }),
    competitionId && schoolId
      ? prisma.team.findFirst({
          where: { competitionId, schoolId, deletedAt: null },
          select: { id: true },
          orderBy: { createdAt: "asc" },
        })
      : null,
  ]);

  const earnedAtByBadgeId = new Map(userBadges.map((entry) => [entry.badgeId, entry.earnedAt]));
  const mappedMissions: HubMission[] = userMissions.map((userMission) => ({
    id: userMission.id,
    title: userMission.mission.title,
    description: userMission.mission.description,
    reward: userMission.mission.rewardPoints,
    progress: userMission.progress,
    status: userMission.status,
    statusLabel: MISSION_STATUS_LABELS[userMission.status],
    completedAt: userMission.completedAt ? formatDate(userMission.completedAt) : null,
  }));
  const mappedBadges: HubBadge[] = catalogBadges.map((badge) => {
    const earnedAt = earnedAtByBadgeId.get(badge.id) ?? null;
    return {
      id: badge.id,
      name: badge.name,
      description: badge.description,
      iconUrl: badge.iconUrl,
      earnedAt: earnedAt ? formatDate(earnedAt) : null,
    };
  });

  const { active, completed } = partitionMissions(mappedMissions);
  const { earned, locked } = partitionBadges(mappedBadges);
  const totalLp = balance?.balance ?? 0;
  const progress = getLevelProgress(totalLp);

  return {
    pass: {
      lp: totalLp,
      lifetimeEarned: balance?.lifetimeEarned ?? 0,
      level: progress.level,
      progressPercent: progress.progressPercent,
      progressLP: progress.progressLP,
      nextLevelLP: progress.nextLevelLP,
      isMaxLevel: progress.isMaxLevel,
      badgeCount: earned.length,
      featuredBadges: earned.slice(0, 4).map((badge) => ({ id: badge.id, name: badge.name })),
    },
    missions: { active, completed },
    badges: { earned, locked },
    explore: { teamId: currentTeam?.id ?? null },
  };
}
