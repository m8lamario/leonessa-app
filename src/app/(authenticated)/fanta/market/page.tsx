import { redirect } from "next/navigation";

import { isOnboardingComplete, requireUser } from "@/features/auth/server/guards";
import { MarketDashboard } from "@/features/fanta/components";
import { getMarketDashboard, hasFantasyTeam } from "@/features/fanta/server";

export const dynamic = "force-dynamic";

export default async function FantaMarketPage() {
  const user = await requireUser();
  if (!isOnboardingComplete(user)) redirect("/onboarding");
  if (!(await hasFantasyTeam(user.id))) redirect("/fanta/team");

  const market = await getMarketDashboard(user.id);
  return <MarketDashboard market={market} />;
}
