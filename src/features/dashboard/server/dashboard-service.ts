import "server-only";

import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { getLevelProgress } from "@/features/rewards/levels";

import type {
  DashboardData,
  DashboardEvent,
  DashboardMission,
  DashboardNewsArticle,
  DashboardRankingEntry,
} from "../types";

const LEONESSA_CUP_SLUG = "leonessa-cup";

const dateTimeFormatter = new Intl.DateTimeFormat("it-IT", {
  dateStyle: "full",
  timeStyle: "short",
  timeZone: "Europe/Rome",
});

const dateFormatter = new Intl.DateTimeFormat("it-IT", {
  day: "2-digit",
  month: "short",
  timeZone: "Europe/Rome",
});

const missionStatusLabels = {
  AVAILABLE: "Disponibile",
  IN_PROGRESS: "In corso",
  COMPLETED: "Completata",
  CLAIMED: "Riscossa",
} as const;

type DashboardFeaturedMatchRow = Prisma.MatchGetPayload<{
  select: {
    id: true;
    startAt: true;
    venue: true;
    status: true;
    homeTeam: { select: { name: true } };
    awayTeam: { select: { name: true } };
  };
}>;

type DashboardMissionRow = Prisma.UserMissionGetPayload<{
  select: {
    id: true;
    progress: true;
    status: true;
    mission: { select: { title: true; description: true; rewardPoints: true } };
  };
}>;

type DashboardNewsRow = Prisma.NewsArticleGetPayload<{
  select: {
    id: true;
    title: true;
    excerpt: true;
    content: true;
    publishedAt: true;
    createdAt: true;
    type: true;
  };
}>;

type DashboardEventRow = Prisma.EventGetPayload<{
  select: {
    id: true;
    title: true;
    startAt: true;
    location: true;
  };
}>;

function formatDateTime(date: Date) {
  return dateTimeFormatter.format(date);
}

function formatDate(date: Date) {
  return dateFormatter.format(date).replace(".", "");
}

function getMissionStatus(status: keyof typeof missionStatusLabels) {
  return missionStatusLabels[status];
}

function getNewsCategory(type: "ARTICLE" | "ANNOUNCEMENT" | "MATCH_REPORT") {
  switch (type) {
    case "MATCH_REPORT":
      return "Match";
    case "ANNOUNCEMENT":
      return "Annuncio";
    default:
      return "Cup";
  }
}

function getNewsVisual(type: "ARTICLE" | "ANNOUNCEMENT" | "MATCH_REPORT") {
  return type === "ANNOUNCEMENT" ? "sponsor" : "draw";
}

function mapFeaturedMatch(
  match: DashboardFeaturedMatchRow | null,
  following: boolean,
  now = new Date(),
): DashboardData["featuredMatch"] {
  if (!match) {
    return null;
  }

  const kickoffPassed = match.startAt.getTime() <= now.getTime();
  const matchStatus =
    match.status === "SCHEDULED" && kickoffPassed ? "LIVE" : match.status;

  return {
    id: match.id,
    homeTeam: match.homeTeam.name,
    awayTeam: match.awayTeam.name,
    schedule: formatDateTime(match.startAt),
    venue: match.venue ?? "Sede da comunicare",
    status:
      matchStatus === "LIVE"
        ? "LIVE"
        : matchStatus === "FINISHED"
          ? "FINITA"
          : "IN PROGRAMMA",
    matchStatus,
    startAt: match.startAt.toISOString(),
    following,
  };
}

function mapMission(
  userMission: DashboardMissionRow,
): DashboardMission {
  return {
    id: userMission.id,
    title: userMission.mission.title,
    description: userMission.mission.description,
    reward: userMission.mission.rewardPoints,
    progress: userMission.progress,
    target: null,
    status: getMissionStatus(userMission.status),
  };
}

function mapNews(article: DashboardNewsRow): DashboardNewsArticle {
  return {
    id: article.id,
    title: article.title,
    excerpt: article.excerpt ?? article.content.slice(0, 140),
    date: article.publishedAt ? formatDate(article.publishedAt) : formatDate(article.createdAt),
    category: getNewsCategory(article.type),
    visual: getNewsVisual(article.type),
  };
}

function mapEvent(event: DashboardEventRow): DashboardEvent {
  return {
    id: event.id,
    title: event.title,
    date: formatDate(event.startAt),
    location: event.location ?? "Luogo da comunicare",
  };
}

export async function getDashboardData(
  userId: string,
  schoolId: string | null,
): Promise<DashboardData> {
  const [competition, balance] = await Promise.all([
    prisma.competition.findUnique({
      where: { slug: LEONESSA_CUP_SLUG },
      select: { id: true },
    }),
    prisma.userLPBalance.findUnique({
      where: { userId },
      select: { balance: true },
    }),
  ]);

  const competitionId = competition?.id ?? null;
  const missionCompetitionFilter = competitionId
    ? { OR: [{ competitionId }, { competitionId: null }] }
    : { competitionId: null };

  const [featuredMatch, userMissions, rankingRows, newsRows, eventRows, currentTeam] =
    await Promise.all([
      competitionId
        ? prisma.match.findFirst({
            where: {
              competitionId,
              status: { in: ["LIVE", "SCHEDULED"] },
              deletedAt: null,
            },
            select: {
              id: true,
              startAt: true,
              venue: true,
              status: true,
              homeTeam: { select: { name: true } },
              awayTeam: { select: { name: true } },
            },
            orderBy: [{ status: "desc" }, { startAt: "asc" }],
          })
        : null,
      prisma.userMission.findMany({
        where: {
          userId,
          status: { in: ["AVAILABLE", "IN_PROGRESS"] },
          mission: {
            deletedAt: null,
            ...missionCompetitionFilter,
          },
        },
        select: {
          id: true,
          progress: true,
          status: true,
          mission: { select: { title: true, description: true, rewardPoints: true } },
        },
        orderBy: { createdAt: "asc" },
        take: 3,
      }),
      competitionId
        ? prisma.schoolRanking.findMany({
            where: { competitionId },
          select: {
            id: true,
            schoolId: true,
            totalPoints: true,
            wins: true,
            draws: true,
            losses: true,
            school: { select: { name: true } },
          },
          orderBy: [
              { totalPoints: "desc" },
              { wins: "desc" },
              { draws: "desc" },
              { losses: "asc" },
            ],
          })
        : [],
      competitionId
        ? prisma.newsArticle.findMany({
            where: {
              deletedAt: null,
              status: "PUBLISHED",
              OR: [{ competitionId }, { competitionId: null }],
            },
            select: {
              id: true,
              title: true,
              excerpt: true,
              content: true,
              publishedAt: true,
              createdAt: true,
              type: true,
            },
            orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
            take: 2,
          })
        : [],
      competitionId
        ? prisma.event.findMany({
            where: {
              competitionId,
              startAt: { gte: new Date() },
              deletedAt: null,
            },
            select: { id: true, title: true, startAt: true, location: true },
            orderBy: { startAt: "asc" },
            take: 2,
          })
        : [],
      competitionId && schoolId
        ? prisma.team.findFirst({
            where: {
              competitionId,
              schoolId,
              deletedAt: null,
            },
            select: { id: true },
            orderBy: { createdAt: "asc" },
          })
        : null,
    ]);

  const ranking = rankingRows;
  const currentSchoolRanking = ranking.find((entry) => entry.schoolId === schoolId);
  const currentSchoolPosition = currentSchoolRanking
    ? ranking.findIndex((entry) => entry.schoolId === currentSchoolRanking.schoolId) + 1
    : null;
  const totalLp = balance?.balance ?? 0;

  const following = featuredMatch
    ? Boolean(
        await prisma.followedMatch.findUnique({
          where: {
            userId_matchId: { userId, matchId: featuredMatch.id },
          },
          select: { id: true },
        }),
      )
    : false;

  return {
    school: {
      position: currentSchoolPosition,
      points: currentSchoolRanking?.totalPoints ?? 0,
      teamId: currentTeam?.id ?? null,
    },
    featuredMatch: mapFeaturedMatch(featuredMatch, following),
    missions: userMissions.map(mapMission),
    schoolRanking: ranking.map<DashboardRankingEntry>((entry) => ({
      id: entry.schoolId,
      schoolId: entry.schoolId,
      name: entry.school.name,
      points: entry.totalPoints,
      isCurrentSchool: entry.schoolId === schoolId,
    })),
    news: newsRows.map(mapNews),
    events: eventRows.map(mapEvent),
    profile: {
      level: getLevelProgress(totalLp).level,
      totalLp,
    },
  };
}
