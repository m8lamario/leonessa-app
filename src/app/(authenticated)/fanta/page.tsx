import { redirect } from "next/navigation";

import { isOnboardingComplete, requireUser } from "@/features/auth/server/guards";
import { FantaDashboard } from "@/features/fanta";
import { getFantasyDashboardData, getMarketDashboard } from "@/features/fanta/server";

export const dynamic = "force-dynamic";

export default async function FantaPage() {
  const user = await requireUser();

  if (!isOnboardingComplete(user)) {
    redirect("/onboarding");
  }

  const [dashboard, lineup] = await Promise.all([
    getFantasyDashboardData(user.id),
    getMarketDashboard(user.id),
  ]);

  return <FantaDashboard dashboard={dashboard} lineup={lineup.team ? lineup : null} />;
}
