import "server-only";

import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { grantAchievement, recordActivity } from "@/features/fanta/server/social-service";
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

  await runScoringOnLatest();

  await recordActivity({
    type: "big_points",
    title: `Giornata simulata completata: ${rounds} partite, ${goals} gol, ${yellows} ammonizioni`,
  });

  logger.info({ rounds, goals, assists, yellows }, "[SIMULATION] Matchday generated");
  return { rounds, goals, assists, yellows };
}

async function runScoringOnLatest() {
  const { syncFantasyScoring } = await import("@/features/fanta/server");
  await syncFantasyScoring();
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
    where: {
      OR: [{ email: { startsWith: "sandbox-" } }, { email: { startsWith: "fanta-player-" } }],
    },
    select: { id: true },
  });
  const ids = sandboxUsers.map((user) => user.id);

  await prisma.notification.deleteMany({ where: { userId: { in: ids } } });
  await prisma.fantasyAchievement.deleteMany();
  await prisma.fantasyActivity.deleteMany();
  await prisma.fantasyScore.deleteMany();
  await prisma.fantasyMatchday.deleteMany();
  await prisma.fantasyProcessedMatch.deleteMany();
  await prisma.fantasyTeamTransfer.deleteMany();
  await prisma.fantasyTeamPlayer.deleteMany();
  await prisma.fantasyTeam.deleteMany();
  await prisma.fantasyPlayerValueHistory.deleteMany();
  await prisma.fantasyPlayerStat.deleteMany();
  await prisma.matchEvent.deleteMany();
  await prisma.match.deleteMany({ where: { competition: { slug: LEONESSA_SLUG } } });
  await prisma.newsArticle.deleteMany({ where: { slug: { startsWith: "sandbox-" } } });
  await prisma.event.deleteMany({ where: { competition: { slug: LEONESSA_SLUG } } });
  await prisma.teamMember.deleteMany({ where: { team: { competition: { slug: LEONESSA_SLUG } } } });
  await prisma.team.deleteMany({ where: { competition: { slug: LEONESSA_SLUG } } });
  await prisma.user.deleteMany({ where: { id: { in: ids } } });

  logger.info({}, "[SIMULATION] Sandbox reset");
  return { reset: true };
}
