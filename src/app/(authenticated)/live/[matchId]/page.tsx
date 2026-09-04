import { notFound, redirect } from "next/navigation";

import { isOnboardingComplete, requireUserForPage } from "@/features/auth/server/guards";
import { LiveMatchPage, getLiveMatchView } from "@/features/matches";
import { AppError } from "@/utils/errors";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ matchId: string }> };

export default async function LiveMatchRoute({ params }: PageProps) {
  const user = await requireUserForPage();
  if (!isOnboardingComplete(user)) {
    redirect("/onboarding");
  }

  const { matchId } = await params;

  let match;
  try {
    match = await getLiveMatchView(matchId);
  } catch (error) {
    if (error instanceof AppError && error.status === 404) {
      notFound();
    }
    throw error;
  }

  return <LiveMatchPage match={match} />;
}
