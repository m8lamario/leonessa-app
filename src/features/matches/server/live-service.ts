import "server-only";

import { prisma } from "@/lib/prisma";
import { AppError } from "@/utils/errors";

const dateTimeFormatter = new Intl.DateTimeFormat("it-IT", {
  dateStyle: "full",
  timeStyle: "short",
  timeZone: "Europe/Rome",
});

export type LiveMatchView = {
  id: string;
  status: "SCHEDULED" | "LIVE" | "FINISHED" | "CANCELLED";
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  venue: string;
  startAt: string;
  schedule: string;
  events: Array<{
    id: string;
    type: string;
    minute: number;
    playerName: string | null;
  }>;
};

export async function getLiveMatchView(matchId: string): Promise<LiveMatchView> {
  const match = await prisma.match.findFirst({
    where: { id: matchId, deletedAt: null },
    select: {
      id: true,
      status: true,
      startAt: true,
      venue: true,
      homeScore: true,
      awayScore: true,
      homeTeam: { select: { name: true } },
      awayTeam: { select: { name: true } },
      events: {
        select: {
          id: true,
          type: true,
          minute: true,
          player: { select: { user: { select: { name: true, surname: true } } } },
        },
        orderBy: { minute: "asc" },
        take: 40,
      },
    },
  });

  if (!match) {
    throw new AppError("NOT_FOUND", "Partita non trovata.", 404);
  }

  return {
    id: match.id,
    status: match.status,
    homeTeam: match.homeTeam.name,
    awayTeam: match.awayTeam.name,
    homeScore: match.homeScore,
    awayScore: match.awayScore,
    venue: match.venue ?? "Sede da comunicare",
    startAt: match.startAt.toISOString(),
    schedule: dateTimeFormatter.format(match.startAt),
    events: match.events.map((event) => ({
      id: event.id,
      type: event.type,
      minute: event.minute,
      playerName: event.player?.user
        ? [event.player.user.name, event.player.user.surname].filter(Boolean).join(" ") || null
        : null,
    })),
  };
}
