import { NextResponse } from "next/server";

import { LEONESSA_CUP_SLUG } from "@/features/cup/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const competition = await prisma.competition.findUnique({
    where: { slug: LEONESSA_CUP_SLUG },
  });

  if (!competition) {
    return NextResponse.json({ rankings: [] });
  }

  const rankings = await prisma.schoolRanking.findMany({
    where: { competitionId: competition.id },
    include: { school: true },
    orderBy: [{ totalPoints: "desc" }, { wins: "desc" }, { draws: "desc" }, { losses: "asc" }],
  });

  return NextResponse.json({
    competition: {
      id: competition.id,
      name: competition.name,
      slug: competition.slug,
      season: competition.season,
    },
    rankings: rankings.map((ranking, index) => ({
      rank: index + 1,
      schoolId: ranking.schoolId,
      school: {
        id: ranking.school.id,
        name: ranking.school.name,
        shortName: ranking.school.shortName,
        logoUrl: ranking.school.logoUrl,
      },
      totalPoints: ranking.totalPoints,
      wins: ranking.wins,
      draws: ranking.draws,
      losses: ranking.losses,
      matchesPlayed: ranking.matchesPlayed,
    })),
  });
}
