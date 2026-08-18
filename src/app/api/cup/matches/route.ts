import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { toMatchDto } from "@/features/cup/server/dto";

export const dynamic = "force-dynamic";

export async function GET() {
  const competition = await prisma.competition.findUnique({
    where: { slug: "leonessa-cup" },
  });

  if (!competition) {
    return NextResponse.json({ matches: [] });
  }

  const matches = await prisma.match.findMany({
    where: {
      competitionId: competition.id,
      deletedAt: null,
    },
    select: {
      id: true,
      startAt: true,
      status: true,
      homeScore: true,
      awayScore: true,
      venue: true,
      competition: { select: { id: true, slug: true, name: true } },
      homeTeam: {
        select: {
          id: true,
          eslId: true,
          name: true,
          school: { select: { shortName: true, logoUrl: true } },
        },
      },
      awayTeam: {
        select: {
          id: true,
          eslId: true,
          name: true,
          school: { select: { shortName: true, logoUrl: true } },
        },
      },
    },
    orderBy: { startAt: "asc" },
  });

  return NextResponse.json({
    matches: matches.map(toMatchDto),
  });
}
