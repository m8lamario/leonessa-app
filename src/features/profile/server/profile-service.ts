import "server-only";

import { getLevelProgress } from "@/features/rewards/levels";
import { prisma } from "@/lib/prisma";

import type { ProfileIdentity } from "../types";

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

export async function getProfileIdentity(
  userId: string,
  schoolId: string | null,
  schoolName: string | null,
): Promise<ProfileIdentity> {
  const [competition, balance, earnedBadges, missionsCompleted, eventsAttended] = await Promise.all([
    prisma.competition.findUnique({
      where: { slug: LEONESSA_CUP_SLUG },
      select: { id: true },
    }),
    prisma.userLPBalance.findUnique({
      where: { userId },
      select: { balance: true },
    }),
    prisma.userBadge.findMany({
      where: {
        userId,
        badge: { deletedAt: null, active: true },
      },
      select: {
        earnedAt: true,
        badge: { select: { id: true, name: true, description: true } },
      },
      orderBy: { earnedAt: "desc" },
    }),
    prisma.userMission.count({
      where: { userId, status: { in: ["COMPLETED", "CLAIMED"] } },
    }),
    prisma.eventAttendance.count({
      where: { userId },
    }),
  ]);

  let schoolRank: number | null = null;
  if (competition?.id && schoolId) {
    const rankingRows = await prisma.schoolRanking.findMany({
      where: { competitionId: competition.id },
      select: { schoolId: true, totalPoints: true, wins: true, draws: true, losses: true },
      orderBy: [{ totalPoints: "desc" }, { wins: "desc" }, { draws: "desc" }, { losses: "asc" }],
    });
    const index = rankingRows.findIndex((entry) => entry.schoolId === schoolId);
    schoolRank = index >= 0 ? index + 1 : null;
  }

  const totalLp = balance?.balance ?? 0;
  const badges = earnedBadges.map((entry) => ({
    id: entry.badge.id,
    name: entry.badge.name,
    description: entry.badge.description,
    earnedAt: formatDate(entry.earnedAt),
  }));

  return {
    schoolName,
    schoolRank,
    level: getLevelProgress(totalLp).level,
    totalLp,
    featuredBadge: badges[0]?.name ?? null,
    badges,
    stats: [
      {
        label: "Ranking scuola",
        value: schoolRank ? `#${schoolRank}` : "—",
        detail: schoolRank ? schoolName ?? "La tua scuola" : "Non disponibile",
      },
      {
        label: "Missioni",
        value: String(missionsCompleted),
        detail: "completate",
      },
      {
        label: "Badge",
        value: String(badges.length),
        detail: "ottenuti",
      },
      {
        label: "Eventi",
        value: String(eventsAttended),
        detail: "partecipati",
      },
    ],
  };
}
