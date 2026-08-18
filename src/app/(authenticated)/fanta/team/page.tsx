import { redirect } from "next/navigation";

import { isOnboardingComplete, requireUser } from "@/features/auth/server/guards";
import { TeamBuilder } from "@/features/fanta/components/team-builder";
import { hasFantasyTeam } from "@/features/fanta/server";

export const dynamic = "force-dynamic";

export default async function FantaTeamBuilderPage() {
  const user = await requireUser();
  if (!isOnboardingComplete(user)) redirect("/onboarding");
  if (await hasFantasyTeam(user.id)) redirect("/fanta");
  return <TeamBuilder />;
}
