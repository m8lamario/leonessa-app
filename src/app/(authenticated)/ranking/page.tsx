import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { isOnboardingComplete, requireUserForPage } from "@/features/auth/server/guards";
import { getRankingData, RankingDashboard } from "@/features/ranking";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Ranking | Leonessa",
};

export default async function RankingPage() {
  const user = await requireUserForPage();

  if (!isOnboardingComplete(user)) {
    redirect("/onboarding");
  }

  const initialData = await getRankingData(user.id);

  return <RankingDashboard initialData={initialData} />;
}

