import "server-only";

import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  getMatchdayRound,
  getPlayerBasePoints,
  type ScorableMatch,
} from "../lib/scoring-engine";
import { assertControlCenterEnabled } from "./control-center-service";
import { applyMatchdayValueAdjustments, valueDeltaFromPoints } from "./value-engine";

const SANDBOX_SLUG = "leonessa-cup-sandbox";

function toScorableMatch(match: {
  homeTeamId: string;
  awayTeamId: string;
  homeScore: number;
  awayScore: number;
  events: Array<{ playerId: string | null; type: string }>;
}): ScorableMatch {
  return {
    homeTeamId: match.homeTeamId,
    awayTeamId: match.awayTeamId,
    homeScore: match.homeScore,
    awayScore: match.awayScore,
    events: match.events.map((event) => ({
      playerId: event.playerId,
      type: event.type,
    })),
  };
}

export async function closeSandboxMatchday(matchId: string) {
  assertControlCenterEnabled();
  return prisma.$transaction(
    async (tx) => {
      const match = await tx.match.findFirst({
        where: {
          id: matchId,
          competition: { slug: SANDBOX_SLUG },
          status: "FINISHED",
          deletedAt: null,
        },
        select: { id: true, startAt: true },
      });
      if (!match) throw new Error("Partita Sandbox non trovata o non completata.");
      const start = new Date(match.startAt);
      start.setUTCHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setUTCDate(end.getUTCDate() + 1);
      const matches = await tx.match.findMany({
        where: {
          competition: { slug: SANDBOX_SLUG },
          status: "FINISHED",
          startAt: { gte: start, lt: end },
          deletedAt: null,
        },
        include: { events: true },
      });
      const round = getMatchdayRound(start);
      const matchday = await tx.fantasyMatchday.upsert({
        where: { round },
        update: { completedAt: new Date() },
        create: {
          round,
          startedAt: start,
          completedAt: new Date(),
        },
      });
      if (matchday.valueUpdatedAt) throw new Error("Questa giornata è già stata chiusa.");
      const players = await tx.teamMember.findMany({
        where: { team: { competition: { slug: SANDBOX_SLUG } }, role: "PLAYER", leftAt: null },
        select: {
          id: true,
          teamId: true,
          fantasyRole: true,
          fantasyValue: true,
          user: { select: { name: true, surname: true } },
        },
      });
      const points = new Map<string, number>();
      for (const player of players) {
        let total = 0;
        for (const current of matches) {
          if (![current.homeTeamId, current.awayTeamId].includes(player.teamId)) continue;
          total += getPlayerBasePoints(toScorableMatch(current), player);
        }
        points.set(player.id, total);
      }
      const adjustments = players.map((player) => ({
        playerId: player.id,
        oldValue: player.fantasyValue,
        newValue: player.fantasyValue + valueDeltaFromPoints(points.get(player.id) ?? 0),
        points: points.get(player.id) ?? 0,
      }));
      const changed = await applyMatchdayValueAdjustments(
        tx,
        adjustments,
        matchday.id,
        "Chiusura giornata",
      );
      return {
        matchdayId: matchday.id,
        matches: matches.length,
        changed,
        breakdown: adjustments.map((item) => ({
          ...item,
          delta: Math.max(5, Math.min(150, item.newValue)) - item.oldValue,
          name: players.find((player) => player.id === item.playerId)?.user,
        })),
      };
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
  );
}
