import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { isOnboardingComplete, requireUserForPage } from "@/features/auth/server/guards";
import { getRankingData, RankingDashboard } from "@/features/ranking";
import type { RankingTab } from "@/features/ranking/types/ranking";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Ranking | Leonessa",
};

function parseTab(value: string | undefined): RankingTab {
  if (value === "scuole" || value === "leghe" || value === "generale") return value;
  return "generale";
}

export default async function RankingPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const user = await requireUserForPage();

  if (!isOnboardingComplete(user)) {
    redirect("/onboarding");
  }

  const params = await searchParams;
  const initialData = await getRankingData(user.id);

  return (
    <Suspense>
      <RankingDashboard initialData={initialData} initialTab={parseTab(params.tab)} />
    </Suspense>
  );
}
