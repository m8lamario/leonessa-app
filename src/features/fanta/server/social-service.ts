import "server-only";

import { prisma } from "@/lib/prisma";
import { ACHIEVEMENTS, type AchievementCode } from "../achievements";

export const ACTIVITY_TYPES = {
  rankingUp: "ranking_up",
  playerBought: "player_bought",
  bigPoints: "big_points",
  captainChange: "captain_change",
  bestBuy: "best_buy",
  achievement: "achievement",
} as const;

export type ActivityDto = {
  id: string;
  type: string;
  title: string;
  description: string | null;
  createdAt: string;
  emoji: string;
};

export type AchievementDto = {
  code: string;
  emoji: string;
  title: string;
  description: string;
  unlocked: boolean;
  unlockedAt: string | null;
};

export type TopPerformerDto = {
  name: string;
  points: number;
};

export type MvpDto = {
  name: string;
  school: string;
  points: number;
};

export type RivalDto = {
  userId: string;
  teamName: string;
  userName: string;
  points: number;
  delta: number;
};

export type HallOfFameDto = {
  bestMatchday: { teamName: string; points: number } | null;
  topGoals: { playerName: string; goals: number } | null;
  biggestGrowth: { playerName: string; growth: number } | null;
  topWins: { userName: string; points: number } | null;
};

export type WeeklyDuelDto = {
  opponent: string;
  myPoints: number;
  rivalPoints: number;
} | null;

export type SocialDashboardDto = {
  activity: ActivityDto[];
  topPerformers: TopPerformerDto[];
  mvp: MvpDto | null;
  rival: RivalDto | null;
  achievements: AchievementDto[];
  weeklyDuel: WeeklyDuelDto;
  hallOfFame: HallOfFameDto;
  topScorers: Array<{ name: string; goals: number }>;
  bestBuyers: Array<{ name: string; value: number }>;
};

const ACTIVITY_EMOJI: Record<string, string> = {
  ranking_up: "🔥",
  player_bought: "📈",
  big_points: "⚽",
  captain_change: "👑",
  best_buy: "💎",
  achievement: "🏅",
};

function emojiFor(type: string) {
  return ACTIVITY_EMOJI[type] ?? "📣";
}

function fullName(name: string | null, surname: string | null) {
  return [name, surname].filter(Boolean).join(" ") || "Giocatore";
}

export async function getSocialDashboard(userId: string): Promise<SocialDashboardDto> {
  const myTeam = await prisma.fantasyTeam.findUnique({
    where: { userId },
    include: {
      user: { select: { name: true, surname: true } },
      scores: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });

  const latestMatchday = await prisma.fantasyMatchday.findFirst({ orderBy: { round: "desc" } });

  const [activityRows, topScores, achievements] = await Promise.all([
    prisma.fantasyActivity.findMany({ orderBy: { createdAt: "desc" }, take: 20 }),
    prisma.fantasyScore.findMany({
      orderBy: { points: "desc" },
      take: 3,
      include: { fantasyTeam: { select: { name: true } } },
    }),
    getAchievements(userId),
  ]);

  const mvp = latestMatchday ? await findMvp(latestMatchday) : null;
  const rival = myTeam ? await findRival(myTeam.id, myTeam.userId) : null;
  const weeklyDuel = myTeam && rival ? await findWeeklyDuel(myTeam.id, rival.userId) : null;
  const [hallOfFame, topScorers, bestBuyers] = await Promise.all([
    buildHallOfFame(),
    buildTopScorers(),
    buildBestBuyers(),
  ]);
  if (mvp) await recordIfMissing("MATCHDAY_MVP", `MVP della giornata: ${mvp.name}`);
  if (bestBuyers[0])
    await recordIfMissing(
      "PLAYER_MOST_SELECTED",
      `Giocatore più acquistato: ${bestBuyers[0].name}`,
    );

  return {
    activity: activityRows.map((row) => ({
      id: row.id,
      type: row.type,
      title: row.title,
      description: row.description,
      createdAt: row.createdAt.toISOString(),
      emoji: emojiFor(row.type),
    })),
    topPerformers: topScores.map((row) => ({
      name: row.fantasyTeam.name,
      points: row.points,
    })),
    mvp,
    rival,
    achievements,
    weeklyDuel,
    hallOfFame,
    topScorers,
    bestBuyers,
  };
}

async function findMvp(matchday: { id: string }): Promise<MvpDto | null> {
  const topScore = await prisma.fantasyScore.findFirst({
    where: { matchdayId: matchday.id },
    orderBy: { points: "desc" },
    include: { fantasyTeam: { select: { players: { select: { playerId: true } } } } },
  });
  if (!topScore) return null;

  const playerIds = topScore.fantasyTeam.players.map((player) => player.playerId);
  const events = await prisma.matchEvent.findMany({
    where: { playerId: { in: playerIds } },
    select: { playerId: true, type: true },
  });
  const pointsByPlayer = new Map<string, number>();
  for (const event of events) {
    if (!event.playerId) continue;
    const delta = EVENT_POINTS[event.type] ?? 0;
    pointsByPlayer.set(event.playerId, (pointsByPlayer.get(event.playerId) ?? 0) + delta);
  }

  let bestPlayerId = "";
  let best = -Infinity;
  for (const [playerId, points] of pointsByPlayer) {
    if (points > best) {
      best = points;
      bestPlayerId = playerId;
    }
  }
  if (!bestPlayerId) return null;

  const player = await prisma.teamMember.findFirst({
    where: { id: bestPlayerId },
    select: {
      user: { select: { name: true, surname: true } },
      team: { select: { school: { select: { shortName: true } } } },
    },
  });
  if (!player) return null;

  return {
    name: fullName(player.user.name, player.user.surname),
    school: player.team.school.shortName,
    points: best,
  };
}

async function findRival(myTeamId: string, myUserId: string): Promise<RivalDto | null> {
  const teams = await prisma.fantasyTeam.findMany({
    orderBy: [{ totalPoints: "desc" }, { createdAt: "asc" }],
    include: { user: { select: { name: true, surname: true } } },
  });
  const myIndex = teams.findIndex((team) => team.id === myTeamId);
  if (myIndex < 0) return null;

  let rivalIndex = -1;
  if (myIndex > 0 && teams[myIndex - 1].userId !== myUserId) {
    rivalIndex = myIndex - 1;
  } else if (myIndex < teams.length - 1 && teams[myIndex + 1].userId !== myUserId) {
    rivalIndex = myIndex + 1;
  }
  if (rivalIndex < 0) return null;

  const rival = teams[rivalIndex];
  return {
    userId: rival.userId,
    teamName: rival.name,
    userName: fullName(rival.user.name, rival.user.surname),
    points: rival.totalPoints,
    delta: teams[myIndex].totalPoints - rival.totalPoints,
  };
}

async function findWeeklyDuel(myTeamId: string, rivalUserId: string): Promise<WeeklyDuelDto> {
  const matchday = await prisma.fantasyMatchday.findFirst({ orderBy: { round: "desc" } });
  if (!matchday) return null;

  const rivalTeam = await prisma.fantasyTeam.findUnique({ where: { userId: rivalUserId } });
  if (!rivalTeam) return null;

  const [myScore, rivalScore] = await Promise.all([
    prisma.fantasyScore.findUnique({
      where: { fantasyTeamId_matchdayId: { fantasyTeamId: myTeamId, matchdayId: matchday.id } },
    }),
    prisma.fantasyScore.findUnique({
      where: {
        fantasyTeamId_matchdayId: { fantasyTeamId: rivalTeam.id, matchdayId: matchday.id },
      },
    }),
  ]);

  return {
    opponent: rivalTeam.name,
    myPoints: myScore?.points ?? 0,
    rivalPoints: rivalScore?.points ?? 0,
  };
}

async function getAchievements(userId: string): Promise<AchievementDto[]> {
  const team = await prisma.fantasyTeam.findUnique({
    where: { userId },
    select: { id: true, totalPoints: true },
  });
  const higherTeams = team
    ? await prisma.fantasyTeam.count({ where: { totalPoints: { gt: team.totalPoints } } })
    : 999;
  if (team && higherTeams === 0) await grantAchievement(userId, "KING");
  if (team && higherTeams < 3) await grantAchievement(userId, "COMPETITIVE");
  if (team && higherTeams < 10) await grantAchievement(userId, "TOP10");

  const ownedPlayers = team
    ? await prisma.fantasyTeamPlayer.findMany({
        where: { fantasyTeamId: team.id },
        select: { playerId: true },
      })
    : [];
  if (ownedPlayers.length > 0) {
    const goals = await prisma.fantasyPlayerStat.count({
      where: { playerId: { in: ownedPlayers.map((player) => player.playerId) }, goals: { gt: 0 } },
    });
    if (goals > 0) await grantAchievement(userId, "TALENT_SCOUT");
    const growth = await prisma.fantasyPlayerValueHistory.findFirst({
      where: {
        playerId: { in: ownedPlayers.map((player) => player.playerId) },
        newValue: { gt: 0 },
      },
      orderBy: { newValue: "desc" },
    });
    if (growth && growth.newValue - growth.oldValue >= 20) await grantAchievement(userId, "TRADER");
  }

  const unlockedRows = await prisma.fantasyAchievement.findMany({
    where: { userId },
    select: { code: true, unlockedAt: true },
  });
  const unlocked = new Map(unlockedRows.map((row) => [row.code, row.unlockedAt]));

  return Object.values(ACHIEVEMENTS).map((achievement) => ({
    code: achievement.code,
    emoji: achievement.emoji,
    title: achievement.title,
    description: achievement.description,
    unlocked: unlocked.has(achievement.code),
    unlockedAt: unlocked.get(achievement.code)?.toISOString() ?? null,
  }));
}

export async function grantAchievement(userId: string, code: AchievementCode) {
  try {
    await prisma.fantasyAchievement.create({ data: { userId, code } });
  } catch {
    // idempotent (unique userId+code)
  }
}

export async function recordActivity(input: { type: string; title: string; description?: string }) {
  await prisma.fantasyActivity.create({
    data: { type: input.type, title: input.title, description: input.description },
  });
}

async function recordIfMissing(type: string, title: string) {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const exists = await prisma.fantasyActivity.findFirst({
    where: { type, title, createdAt: { gte: since } },
    select: { id: true },
  });
  if (!exists) await recordActivity({ type, title });
}

async function buildHallOfFame(): Promise<HallOfFameDto> {
  const [bestMatchday, topGoals, valueHistory] = await Promise.all([
    prisma.fantasyScore.findFirst({
      orderBy: { points: "desc" },
      include: { fantasyTeam: { select: { name: true } } },
    }),
    prisma.fantasyPlayerStat.findFirst({
      orderBy: { goals: "desc" },
      include: { player: { select: { user: { select: { name: true, surname: true } } } } },
    }),
    prisma.fantasyPlayerValueHistory.findMany({
      orderBy: { createdAt: "desc" },
      take: 500,
      include: { player: { select: { user: { select: { name: true, surname: true } } } } },
    }),
  ]);

  const growthMap = new Map<string, { name: string; min: number; max: number }>();
  for (const history of valueHistory) {
    const name = fullName(history.player.user.name, history.player.user.surname);
    const current = growthMap.get(history.playerId) ?? {
      name,
      min: history.oldValue,
      max: history.newValue,
    };
    current.min = Math.min(current.min, history.oldValue);
    current.max = Math.max(current.max, history.newValue);
    growthMap.set(history.playerId, current);
  }
  let biggestGrowth: HallOfFameDto["biggestGrowth"] = null;
  for (const [, value] of growthMap) {
    const growth = value.max - value.min;
    if (!biggestGrowth || growth > biggestGrowth.growth) {
      biggestGrowth = { playerName: value.name, growth };
    }
  }

  const topWins = await prisma.fantasyTeam.findFirst({
    orderBy: { totalPoints: "desc" },
    include: { user: { select: { name: true, surname: true } } },
  });

  return {
    bestMatchday: bestMatchday
      ? { teamName: bestMatchday.fantasyTeam.name, points: bestMatchday.points }
      : null,
    topGoals: topGoals
      ? {
          playerName: fullName(topGoals.player.user.name, topGoals.player.user.surname),
          goals: topGoals.goals,
        }
      : null,
    biggestGrowth: biggestGrowth,
    topWins: topWins
      ? { userName: fullName(topWins.user.name, topWins.user.surname), points: topWins.totalPoints }
      : null,
  };
}

async function buildTopScorers() {
  const rows = await prisma.fantasyPlayerStat.findMany({
    orderBy: { goals: "desc" },
    take: 3,
    include: { player: { select: { user: { select: { name: true, surname: true } } } } },
  });
  return rows.map((row) => ({
    name: fullName(row.player.user.name, row.player.user.surname),
    goals: row.goals,
  }));
}

async function buildBestBuyers() {
  const players = await prisma.teamMember.findMany({
    where: { role: "PLAYER", leftAt: null },
    select: { id: true, user: { select: { name: true, surname: true } } },
  });
  const result = await Promise.all(
    players.map(async (player) => ({
      name: fullName(player.user.name, player.user.surname),
      count: await prisma.fantasyTeamPlayer.count({ where: { playerId: player.id } }),
    })),
  );
  return result
    .map((row) => ({ name: row.name, value: row.count }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 3);
}

const EVENT_POINTS: Record<string, number> = {
  GOAL: 100,
  ASSIST: 50,
  YELLOW_CARD: -20,
  RED_CARD: -50,
  OWN_GOAL: -70,
};
