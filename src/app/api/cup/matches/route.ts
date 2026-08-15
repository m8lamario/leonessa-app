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
    include: {
      competition: true,
      homeTeam: { include: { school: true } },
      awayTeam: { include: { school: true } },
    },
    orderBy: { startAt: "asc" },
  });

  return NextResponse.json({
    matches: matches.map(toMatchDto),
  });
}
