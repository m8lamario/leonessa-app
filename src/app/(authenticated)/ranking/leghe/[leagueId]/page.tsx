import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { isOnboardingComplete, requireUserForPage } from "@/features/auth/server/guards";
import { getLeagueBoard } from "@/features/leagues/server";
import { LeagueBoard } from "@/features/ranking/components/league-board";
import { AppError } from "@/utils/errors";

export const dynamic = "force-dynamic";

type LeagueRankingPageProps = {
  params: Promise<{ leagueId: string }>;
};

export const metadata: Metadata = {
  title: "Lega | Ranking",
};

export default async function LeagueRankingPage({ params }: LeagueRankingPageProps) {
  const user = await requireUserForPage();
  if (!isOnboardingComplete(user)) {
    redirect("/onboarding");
  }

  const { leagueId } = await params;
  let data;

  try {
    data = await getLeagueBoard(leagueId, user.id);
  } catch (error) {
    if (error instanceof AppError && error.code === "NOT_FOUND") {
      notFound();
    }
    throw error;
  }

  return <LeagueBoard data={data} />;
}
