import "server-only";

import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { grantAchievement, recordActivity } from "@/features/fanta/server/social-service";
import { processMatch } from "@/features/fanta/server/scoring-sync";
import { ACHIEVEMENTS } from "@/features/fanta/achievements";

const LEONESSA_SLUG = "leonessa-cup-sandbox";

export function seededRandom(seed: number) {
  let t = seed;
  return () => {
    t = (t * 1103515245 + 12345) & 0x7fffffff;
    return t / 0x7fffffff;
  };
}

export async function simulateMatchday() {
  const competition = await prisma.competition.findUnique({ where: { slug: LEONESSA_SLUG } });
  if (!competition) {
    throw new Error("Sandbox competition not found. Run `npm run sandbox:seed` first.");
  }

  const teams = await prisma.team.findMany({
    where: { competitionId: competition.id, deletedAt: null },
  });
  if (teams.length < 2) {
    throw new Error("Not enough sandbox teams.");
  }

  const random = seededRandom(Date.now() % 99991);
  const rounds = Math.min(2, teams.length - 1);
  let goals = 0;
  const assists = 0;
  let yellows = 0;
  const createdMatchIds: string[] = [];

  for (let i = 0; i < rounds; i++) {
    const home = teams[i];
    const away = teams[i + 1] ?? teams[0];
    if (home.id === away.id) continue;

    const homeScore = Math.floor(random() * 4);
    const awayScore = Math.floor(random() * 3);
    const match = await prisma.match.create({
      data: {
        competitionId: competition.id,
        homeTeamId: home.id,
        awayTeamId: away.id,
        startAt: new Date(),
        status: "FINISHED",
        homeScore,
        awayScore,
      },
    });
    createdMatchIds.push(match.id);

    const players = await prisma.teamMember.findMany({
      where: { teamId: { in: [home.id, away.id] }, role: "PLAYER", leftAt: null },
      select: { id: true },
    });
    if (players.length === 0) continue;

    const eventCount = homeScore + awayScore + (homeScore + awayScore === 0 ? 1 : 0);
    for (let e = 0; e < eventCount; e++) {
      const player = players[Math.floor(random() * players.length)];
      let type: "GOAL" | "YELLOW_CARD" = "GOAL";
      if (e === eventCount - 1 && homeScore + awayScore === 0) {
        type = "YELLOW_CARD";
        yellows += 1;
      } else {
        goals += 1;
      }
      await prisma.matchEvent.create({
        data: { matchId: match.id, type, minute: 15 + e * 12, playerId: player.id },
      });
    }
  }

  await scoreSandboxMatches(createdMatchIds);

  await recordActivity({
    type: "big_points",
    title: `Giornata simulata completata: ${rounds} partite, ${goals} gol, ${yellows} ammonizioni`,
  });

  logger.info({ rounds, goals, assists, yellows }, "[SIMULATION] Matchday generated");
  return { rounds, goals, assists, yellows };
}

/** Persist newly simulated matches through the shared production scoring engine. */
async function scoreSandboxMatches(matchIds: string[]) {
  for (const matchId of matchIds) {
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: { events: true },
    });
    if (!match || match.status !== "FINISHED") continue;

    try {
      await prisma.$transaction((transaction) => processMatch(transaction, match), {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        continue;
      }
      throw error;
    }
  }
}

export async function simulateMarket() {
  const random = seededRandom(Date.now() % 88883);
  const players = await prisma.teamMember.findMany({
    where: { role: "PLAYER", leftAt: null },
    take: 40,
    select: { id: true, fantasyValue: true },
  });

  let updated = 0;
  for (const player of players) {
    const delta = random() > 0.5 ? 1 + Math.floor(random() * 4) : -(1 + Math.floor(random() * 3));
    const newValue = Math.max(5, Math.min(150, player.fantasyValue + delta));
    if (newValue === player.fantasyValue) continue;
    await prisma.teamMember.update({ where: { id: player.id }, data: { fantasyValue: newValue } });
    await prisma.fantasyPlayerValueHistory.create({
      data: {
        playerId: player.id,
        oldValue: player.fantasyValue,
        newValue,
        reason: "Simulazione mercato",
      },
    });
    updated += 1;
  }

  await recordActivity({
    type: "player_bought",
    title: `Mercato simulato: ${updated} giocatori hanno cambiato valore`,
  });

  logger.info({ updated }, "[SIMULATION] Market generated");
  return { updated };
}

export async function simulateNotification(userId?: string) {
  const types = ["SYSTEM", "COMPETITION", "MATCH", "STAFF", "GAMIFICATION"] as const;
  const type = types[Math.floor(Math.random() * types.length)] as
    "SYSTEM" | "COMPETITION" | "MATCH" | "STAFF" | "GAMIFICATION";

  const recipients = userId
    ? [{ id: userId }]
    : await prisma.user.findMany({
        where: { email: { startsWith: "sandbox-" } },
        select: { id: true },
      });

  let created = 0;
  for (const user of recipients) {
    await prisma.notification.create({
      data: {
        userId: user.id,
        type,
        title: "Notifica Sandbox",
        body: `Questa è una notifica simulata di tipo ${type}.`,
        sentAt: new Date(),
      },
    });
    created += 1;
  }

  logger.info({ type, created }, "[SIMULATION] Notification generated");
  return { type, created };
}

export async function simulateAchievement(userId?: string) {
  const code = Object.values(ACHIEVEMENTS)[
    Math.floor(Math.random() * Object.values(ACHIEVEMENTS).length)
  ].code as keyof typeof ACHIEVEMENTS;

  const recipientId =
    userId ??
    (
      await prisma.user.findFirst({
        where: { email: { startsWith: "sandbox-" } },
        select: { id: true },
      })
    )?.id;

  if (!recipientId) {
    throw new Error("No sandbox user to grant achievement to.");
  }

  await grantAchievement(recipientId, ACHIEVEMENTS[code].code);
  await recordActivity({
    type: "achievement",
    title: `Achievement sbloccato: ${ACHIEVEMENTS[code].title}`,
  });

  logger.info({ code, recipientId }, "[SIMULATION] Achievement generated");
  return { code, recipientId };
}

export async function simulateEvent() {
  const competition = await prisma.competition.findUnique({ where: { slug: LEONESSA_SLUG } });
  if (!competition) {
    throw new Error("Sandbox competition not found.");
  }

  await prisma.newsArticle.create({
    data: {
      competitionId: competition.id,
      title: "Aggiornamento Sandbox",
      slug: `sandbox-update-${Date.now()}`,
      excerpt: "Comunicato generato dalla sandbox.",
      content: "Contenuto simulato per verificare dashboard e feed.",
      type: "ANNOUNCEMENT" as const,
      status: "PUBLISHED" as const,
      publishedAt: new Date(),
    },
  });
  await prisma.event.create({
    data: {
      competitionId: competition.id,
      title: `Evento Sandbox ${Date.now()}`,
      startAt: new Date(),
    },
  });

  logger.info({}, "[SIMULATION] Event generated");
  return { created: 1 };
}

export async function resetSandbox() {
  const sandboxUsers = await prisma.user.findMany({
    where: { email: { startsWith: "sandbox-" } },
    select: { id: true },
  });
  const userIds = sandboxUsers.map((user) => user.id);
  const fantasyTeams = await prisma.fantasyTeam.findMany({
    where: { userId: { in: userIds } },
    select: { id: true },
  });
  const fantasyTeamIds = fantasyTeams.map((team) => team.id);
  const players = await prisma.teamMember.findMany({
    where: { team: { competition: { slug: LEONESSA_SLUG } } },
    select: { id: true },
  });
  const playerIds = players.map((player) => player.id);
  const matches = await prisma.match.findMany({
    where: { competition: { slug: LEONESSA_SLUG } },
    select: { id: true },
  });
  const matchIds = matches.map((match) => match.id);
  const referrals = await prisma.referral.findMany({
    where: {
      OR: [{ referrerId: { in: userIds } }, { referredUserId: { in: userIds } }],
    },
    select: { id: true },
  });
  const referralIds = referrals.map((referral) => referral.id);

  await prisma.pointTransaction.deleteMany({
    where: {
      OR: [{ userId: { in: userIds } }, { sourceType: "REFERRAL", sourceId: { in: referralIds } }],
    },
  });
  await prisma.referral.deleteMany({ where: { id: { in: referralIds } } });
  await prisma.notification.deleteMany({ where: { userId: { in: userIds } } });
  await prisma.fantasyAchievement.deleteMany({ where: { userId: { in: userIds } } });
  await prisma.fantasyScore.deleteMany({ where: { fantasyTeamId: { in: fantasyTeamIds } } });
  await prisma.fantasySubstitution.deleteMany({ where: { fantasyTeamId: { in: fantasyTeamIds } } });
  await prisma.fantasyTeamTransfer.deleteMany({ where: { fantasyTeamId: { in: fantasyTeamIds } } });
  await prisma.fantasyTeamPlayer.deleteMany({ where: { fantasyTeamId: { in: fantasyTeamIds } } });
  await prisma.fantasyTeam.deleteMany({ where: { id: { in: fantasyTeamIds } } });
  await prisma.fantasyPlayerValueHistory.deleteMany({ where: { playerId: { in: playerIds } } });
  await prisma.fantasyPlayerStat.deleteMany({ where: { playerId: { in: playerIds } } });
  await prisma.fantasyProcessedMatch.deleteMany({ where: { matchId: { in: matchIds } } });
  await prisma.matchEvent.deleteMany({ where: { matchId: { in: matchIds } } });
  await prisma.match.deleteMany({ where: { id: { in: matchIds } } });
  await prisma.fantasyActivity.deleteMany({ where: { title: { contains: "Sandbox" } } });
  await prisma.newsArticle.deleteMany({ where: { slug: { startsWith: "sandbox-" } } });
  await prisma.event.deleteMany({ where: { competition: { slug: LEONESSA_SLUG } } });
  // Keep sandbox player records and teams: real users may reference them in test scenarios.
  await prisma.user.deleteMany({ where: { id: { in: userIds } } });

  logger.info({}, "[SIMULATION] Sandbox reset");
  return { reset: true };
}
