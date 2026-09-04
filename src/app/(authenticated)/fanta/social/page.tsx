import { redirect } from "next/navigation";

import { isOnboardingComplete, requireUserForPage } from "@/features/auth/server/guards";
import { SocialDashboard } from "@/features/fanta/components";
import { getSocialDashboard, hasFantasyTeam } from "@/features/fanta/server";

export const dynamic = "force-dynamic";

export default async function FantaSocialPage() {
  const user = await requireUserForPage();
  if (!isOnboardingComplete(user)) redirect("/onboarding");
  if (!(await hasFantasyTeam(user.id))) redirect("/fanta/team");

  const social = await getSocialDashboard(user.id);
  return <SocialDashboard social={social} />;
}
