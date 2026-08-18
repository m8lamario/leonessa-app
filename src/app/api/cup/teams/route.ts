import { NextResponse } from "next/server";

import { LEONESSA_CUP_SLUG } from "@/features/cup/server";
import { toTeamDto } from "@/features/cup/server/dto";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const competition = await prisma.competition.findUnique({
    where: { slug: LEONESSA_CUP_SLUG },
  });

  if (!competition) {
    return NextResponse.json({ teams: [] });
  }

  const teams = await prisma.team.findMany({
    where: {
      competitionId: competition.id,
      deletedAt: null,
    },
    select: {
      id: true,
      eslId: true,
      name: true,
      school: { select: { shortName: true, logoUrl: true } },
    },
    orderBy: { name: "asc" },
  });

  return NextResponse.json({
    teams: teams.map(toTeamDto),
  });
}
