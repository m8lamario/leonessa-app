import "server-only";

import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { ACHIEVEMENTS } from "@/features/fanta/achievements";
import { getMarketStatus } from "@/features/fanta/server";
import { validateRosterPlayers } from "@/features/fanta/lib/lineup-validation";
import { getFeaturedPrediction } from "@/features/predictions/server";
import { formatUserInitials, formatUserName } from "@/features/profile/lib/identity";
import { listFollowedUserIds } from "@/features/profile/server/follow-service";
import { getLevelProgress } from "@/features/rewards/levels";

import { pickTodayActions } from "../lib/dashboard-actions";
import { iconForCommunityActivity, pickDashboardActivities } from "../lib/dashboard-activity";
import type {
  DashboardActivity,
  DashboardData,
  DashboardEvent,
  DashboardFantaCta,
  DashboardMission,
  DashboardNewsArticle,
} from "../types";

const LEONESSA_CUP_SLUG = "leonessa-cup";

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

function formatDate(date: Date) {
  return dateFormatter.format(date).replace(".", "");
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

function mapMission(
  userMission: {
    id: string;
    progress: number;
    status: keyof typeof missionStatusLabels;
    mission: { title: string; description: string; rewardPoints: number };
  },
): DashboardMission {
  return {
    id: userMission.id,
    title: userMission.mission.title,
    description: userMission.mission.description,
    reward: userMission.mission.rewardPoints,
    progress: userMission.progress,
    target: null,
    status: missionStatusLabels[userMission.status],
  };
}

async function getFantaCta(userId: string): Promise<DashboardFantaCta> {
  const [team, market, nextMatch] = await Promise.all([
    prisma.fantasyTeam.findUnique({
      where: { userId },
      select: {
        id: true,
        totalPoints: true,
        createdAt: true,
        players: { select: { role: true, status: true, isCaptain: true } },
      },
    }),
    getMarketStatus(),
    prisma.match.findFirst({
      where: {
        deletedAt: null,
        status: { in: ["SCHEDULED", "LIVE"] },
        competition: { slug: LEONESSA_CUP_SLUG },
      },
      select: {
        startAt: true,
        homeTeam: { select: { name: true } },
        awayTeam: { select: { name: true } },
      },
      orderBy: { startAt: "asc" },
    }),
  ]);

  if (!team) {
    return {
      kind: "CREATE",
      title: "Crea la tua squadra Fanta",
      description: "Entra nel Fanta Leonessa e inizia a guadagnare punti.",
      href: "/fanta/team",
      points: null,
      position: null,
    };
  }

  const ahead = await prisma.fantasyTeam.count({
    where: {
      OR: [
        { totalPoints: { gt: team.totalPoints } },
        { totalPoints: team.totalPoints, createdAt: { lt: team.createdAt } },
      ],
    },
  });
  const position = ahead + 1;
  const lineup = validateRosterPlayers(team.players);

  if (!lineup.valid) {
    return {
      kind: "COMPLETE_LINEUP",
      title: "Completa la formazione",
      description: lineup.message ?? "La tua rosa non è ancora pronta per il prossimo match.",
      href: "/fanta",
      points: team.totalPoints,
      position,
    };
  }

  if (market.open) {
    return {
      kind: "MARKET_OPEN",
      title: "Mercato aperto",
      description: "Puoi ancora ritoccare la rosa prima del fischio d'inizio.",
      href: "/fanta/market",
      points: team.totalPoints,
      position,
    };
  }

  if (nextMatch) {
    return {
      kind: "MATCH_SOON",
      title: "Formazione bloccata",
      description: `${nextMatch.homeTeam.name} vs ${nextMatch.awayTeam.name}`,
      href: "/fanta",
      points: team.totalPoints,
      position,
    };
  }

  return {
    kind: "READY",
    title: "La tua formazione è pronta",
    description: `Sei #${position} con ${team.totalPoints.toLocaleString("it-IT")} punti Fanta.`,
    href: "/fanta",
    points: team.totalPoints,
    position,
  };
}

async function getDashboardActivity(
  viewerId: string,
  viewerLp: number,
): Promise<{ activity: DashboardActivity[]; followingAnyone: boolean }> {
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const followedIds = await listFollowedUserIds(viewerId);
  const followed = new Set(followedIds);
  const followedFilter = followedIds.length > 0 ? { userId: { in: followedIds } } : null;

  const [
    communityRows,
    badgeRows,
    followedBadgeRows,
    missionRows,
    followedMissionRows,
    achievementRows,
    followedAchievementRows,
    scoreRows,
    followedScoreRows,
    overtakeRows,
  ] = await Promise.all([
    prisma.fantasyActivity.findMany({
      where: { createdAt: { gte: since } },
      select: { id: true, type: true, title: true, description: true, createdAt: true },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
    prisma.userBadge.findMany({
      where: {
        earnedAt: { gte: since },
        user: { deletedAt: null },
        badge: { deletedAt: null, active: true },
      },
      select: {
        id: true,
        earnedAt: true,
        userId: true,
        badge: { select: { name: true } },
        user: { select: { name: true, surname: true } },
      },
      orderBy: { earnedAt: "desc" },
      take: 6,
    }),
    followedFilter
      ? prisma.userBadge.findMany({
          where: {
            ...followedFilter,
            earnedAt: { gte: since },
            user: { deletedAt: null },
            badge: { deletedAt: null, active: true },
          },
          select: {
            id: true,
            earnedAt: true,
            userId: true,
            badge: { select: { name: true } },
            user: { select: { name: true, surname: true } },
          },
          orderBy: { earnedAt: "desc" },
          take: 8,
        })
      : Promise.resolve([]),
    prisma.userMission.findMany({
      where: {
        status: { in: ["COMPLETED", "CLAIMED"] },
        OR: [{ completedAt: { gte: since } }, { claimedAt: { gte: since } }],
        user: { deletedAt: null },
        mission: { deletedAt: null },
      },
      select: {
        id: true,
        completedAt: true,
        claimedAt: true,
        userId: true,
        mission: { select: { title: true } },
        user: { select: { name: true, surname: true } },
      },
      orderBy: { completedAt: "desc" },
      take: 6,
    }),
    followedFilter
      ? prisma.userMission.findMany({
          where: {
            ...followedFilter,
            status: { in: ["COMPLETED", "CLAIMED"] },
            OR: [{ completedAt: { gte: since } }, { claimedAt: { gte: since } }],
            user: { deletedAt: null },
            mission: { deletedAt: null },
          },
          select: {
            id: true,
            completedAt: true,
            claimedAt: true,
            userId: true,
            mission: { select: { title: true } },
            user: { select: { name: true, surname: true } },
          },
          orderBy: { completedAt: "desc" },
          take: 8,
        })
      : Promise.resolve([]),
    prisma.fantasyAchievement.findMany({
      where: {
        unlockedAt: { gte: since },
        user: { deletedAt: null },
      },
      select: {
        id: true,
        code: true,
        unlockedAt: true,
        userId: true,
        user: { select: { name: true, surname: true } },
      },
      orderBy: { unlockedAt: "desc" },
      take: 6,
    }),
    followedFilter
      ? prisma.fantasyAchievement.findMany({
          where: {
            ...followedFilter,
            unlockedAt: { gte: since },
            user: { deletedAt: null },
          },
          select: {
            id: true,
            code: true,
            unlockedAt: true,
            userId: true,
            user: { select: { name: true, surname: true } },
          },
          orderBy: { unlockedAt: "desc" },
          take: 8,
        })
      : Promise.resolve([]),
    prisma.fantasyScore.findMany({
      where: {
        createdAt: { gte: since },
        fantasyTeam: { user: { deletedAt: null } },
      },
      select: {
        id: true,
        points: true,
        createdAt: true,
        matchday: { select: { round: true } },
        fantasyTeam: {
          select: {
            name: true,
            userId: true,
            user: { select: { name: true, surname: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 6,
    }),
    followedIds.length > 0
      ? prisma.fantasyScore.findMany({
          where: {
            createdAt: { gte: since },
            fantasyTeam: { userId: { in: followedIds }, user: { deletedAt: null } },
          },
          select: {
            id: true,
            points: true,
            createdAt: true,
            matchday: { select: { round: true } },
            fantasyTeam: {
              select: {
                name: true,
                userId: true,
                user: { select: { name: true, surname: true } },
              },
            },
          },
          orderBy: { createdAt: "desc" },
          take: 8,
        })
      : Promise.resolve([]),
    prisma.userFollow.findMany({
      where: {
        followerId: viewerId,
        lastOvertakeAt: { gte: since },
        following: { deletedAt: null },
      },
      select: {
        id: true,
        lastOvertakeAt: true,
        followingId: true,
        following: {
          select: {
            name: true,
            surname: true,
            lpBalance: { select: { balance: true } },
          },
        },
      },
      orderBy: { lastOvertakeAt: "desc" },
      take: 6,
    }),
  ]);

  function fromFollowed(userId: string | null) {
    return Boolean(userId && followed.has(userId));
  }

  const community: DashboardActivity[] = communityRows.map((row) => ({
    id: `community-${row.id}`,
    kind: "community",
    title: row.title,
    detail: row.description,
    occurredAt: row.createdAt.toISOString(),
    icon: iconForCommunityActivity(row.type),
    actorUserId: null,
    href: null,
    fromFollowed: false,
  }));

  const badges: DashboardActivity[] = [...badgeRows, ...followedBadgeRows].map((row) => ({
    id: `badge-${row.id}`,
    kind: "badge" as const,
    title: `${formatUserName(row.user)} ha ottenuto il badge ${row.badge.name}`,
    detail: null,
    occurredAt: row.earnedAt.toISOString(),
    icon: "award",
    actorUserId: row.userId,
    href: `/u/${row.userId}`,
    fromFollowed: fromFollowed(row.userId),
  }));

  const missions: DashboardActivity[] = [...missionRows, ...followedMissionRows].flatMap((row) => {
    const occurredAt = row.completedAt ?? row.claimedAt;
    if (!occurredAt) return [];
    return [
      {
        id: `mission-${row.id}`,
        kind: "mission" as const,
        title: `${formatUserName(row.user)} ha completato ${row.mission.title}`,
        detail: null,
        occurredAt: occurredAt.toISOString(),
        icon: "target",
        actorUserId: row.userId,
        href: `/u/${row.userId}`,
        fromFollowed: fromFollowed(row.userId),
      },
    ];
  });

  const achievements: DashboardActivity[] = [...achievementRows, ...followedAchievementRows].map((row) => {
    const catalog = ACHIEVEMENTS[row.code as keyof typeof ACHIEVEMENTS];
    return {
      id: `achievement-${row.id}`,
      kind: "achievement" as const,
      title: `${formatUserName(row.user)} ha sbloccato ${catalog?.title ?? "un achievement Fanta"}`,
      detail: catalog?.description ?? null,
      occurredAt: row.unlockedAt.toISOString(),
      icon: catalog?.icon ?? "sparkles",
      actorUserId: row.userId,
      href: `/u/${row.userId}`,
      fromFollowed: fromFollowed(row.userId),
    };
  });

  const scores: DashboardActivity[] = [...scoreRows, ...followedScoreRows].map((row) => ({
    id: `score-${row.id}`,
    kind: "fanta_score" as const,
    title: `${formatUserName(row.fantasyTeam.user)} ha totalizzato ${row.points.toLocaleString("it-IT")} punti Fanta`,
    detail: `Giornata ${row.matchday.round} · ${row.fantasyTeam.name}`,
    occurredAt: row.createdAt.toISOString(),
    icon: "trophy",
    actorUserId: row.fantasyTeam.userId,
    href: `/u/${row.fantasyTeam.userId}`,
    fromFollowed: fromFollowed(row.fantasyTeam.userId),
  }));

  const overtakes: DashboardActivity[] = overtakeRows.flatMap((row) => {
    if (!row.lastOvertakeAt) return [];
    const friendLp = row.following.lpBalance?.balance ?? 0;
    return [
      {
        id: `overtake-${row.id}`,
        kind: "overtake" as const,
        title: `${formatUserName(row.following)} ha superato i tuoi LP`,
        detail: `${friendLp.toLocaleString("it-IT")} LP · tu ${viewerLp.toLocaleString("it-IT")}`,
        occurredAt: row.lastOvertakeAt.toISOString(),
        icon: "trending-up",
        actorUserId: row.followingId,
        href: `/u/${row.followingId}`,
        fromFollowed: true,
      },
    ];
  });

  return {
    activity: pickDashboardActivities([
      ...community,
      ...badges,
      ...missions,
      ...achievements,
      ...scores,
      ...overtakes,
    ]),
    followingAnyone: followedIds.length > 0,
  };
}

export async function getDashboardData(
  userId: string,
  schoolId: string | null,
  identity: { name?: string | null; surname?: string | null; schoolName: string },
): Promise<DashboardData> {
  const [competition, balance] = await Promise.all([
    prisma.competition.findUnique({
      where: { slug: LEONESSA_CUP_SLUG },
      select: { id: true },
    }),
    prisma.userLPBalance.findUnique({
      where: { userId },
      select: { balance: true, createdAt: true },
    }),
  ]);

  const competitionId = competition?.id ?? null;
  const missionCompetitionFilter = competitionId
    ? { OR: [{ competitionId }, { competitionId: null }] }
    : { competitionId: null };
  const totalLp = balance?.balance ?? 0;

  const [userMissions, rankingRows, newsRows, eventRows, currentTeam, fanta, higherLp, socialFeed] =
    await Promise.all([
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
              schoolId: true,
              totalPoints: true,
              wins: true,
              draws: true,
              losses: true,
            },
            orderBy: [{ totalPoints: "desc" }, { wins: "desc" }, { draws: "desc" }, { losses: "asc" }],
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
            take: 1,
          })
        : [],
      competitionId && schoolId
        ? prisma.team.findFirst({
            where: { competitionId, schoolId, deletedAt: null },
            select: { id: true },
            orderBy: { createdAt: "asc" },
          })
        : null,
      getFantaCta(userId),
      prisma.userLPBalance.count({
        where: { balance: { gt: totalLp }, user: { deletedAt: null } },
      }),
      getDashboardActivity(userId, totalLp),
    ]);

  const currentSchoolRanking = rankingRows.find((entry) => entry.schoolId === schoolId);
  const currentSchoolPosition = currentSchoolRanking
    ? rankingRows.findIndex((entry) => entry.schoolId === currentSchoolRanking.schoolId) + 1
    : null;
  const rankingPosition = higherLp + 1;
  const missions = userMissions.map(mapMission);
  const events = eventRows.map(mapEvent);

  const featuredMatchId = (
    await prisma.match.findFirst({
      where: {
        competitionId: competitionId ?? undefined,
        deletedAt: null,
        status: { in: ["LIVE", "SCHEDULED"] },
      },
      select: { id: true },
      orderBy: [{ status: "desc" }, { startAt: "asc" }],
    })
  )?.id;

  const following = featuredMatchId
    ? Boolean(
        await prisma.followedMatch.findUnique({
          where: { userId_matchId: { userId, matchId: featuredMatchId } },
          select: { id: true },
        }),
      )
    : false;

  const prediction = await getFeaturedPrediction(
    userId,
    following && featuredMatchId ? new Set([featuredMatchId]) : new Set(),
  );

  const todayActions = pickTodayActions([
    prediction && prediction.editable && !prediction.choice
      ? {
          id: "prediction",
          title: "Fai il pronostico",
          description: `${prediction.homeTeam} vs ${prediction.awayTeam}`,
          href: "#prediction",
        }
      : null,
    fanta.kind === "CREATE" || fanta.kind === "COMPLETE_LINEUP"
      ? {
          id: "fanta",
          title: fanta.title,
          description: fanta.description,
          href: fanta.href,
        }
      : null,
    missions[0]
      ? {
          id: `mission-${missions[0].id}`,
          title: missions[0].title,
          description: `${missions[0].status} · +${missions[0].reward} LP`,
          href: "/altro/missioni",
        }
      : null,
    events[0]
      ? {
          id: `event-${events[0].id}`,
          title: events[0].title,
          description: `${events[0].date} · ${events[0].location}`,
          href: "/altro",
        }
      : null,
    {
      id: "referral",
      title: "Porta un amico",
      description: "Invita e guadagna LP quando l'invito è completato.",
      href: "/altro/referral",
    },
  ]);

  return {
    personal: {
      name: formatUserName(identity),
      initials: formatUserInitials(identity),
      schoolName: identity.schoolName,
      level: getLevelProgress(totalLp).level,
      rankingPosition,
      schoolPosition: currentSchoolPosition,
      schoolPoints: currentSchoolRanking?.totalPoints ?? 0,
      schoolTeamId: currentTeam?.id ?? null,
    },
    fanta,
    prediction,
    todayActions,
    activity: socialFeed.activity,
    followingAnyone: socialFeed.followingAnyone,
    school: {
      name: identity.schoolName,
      position: currentSchoolPosition,
      points: currentSchoolRanking?.totalPoints ?? 0,
      teamId: currentTeam?.id ?? null,
    },
    news: newsRows.map(mapNews),
    events,
  };
}
