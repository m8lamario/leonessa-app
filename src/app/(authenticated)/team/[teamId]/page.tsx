import { redirect } from "next/navigation";

import { isOnboardingComplete, requireUserForPage } from "@/features/auth/server/guards";
import { TeamPageClient } from "@/features/team";
import { getTeamPageData } from "@/features/team/server/team-service";

export const dynamic = "force-dynamic";

export default async function TeamDetailPage({ params }: { params: Promise<{ teamId: string }> }) {
  const user = await requireUserForPage();

  if (!isOnboardingComplete(user)) {
    redirect("/onboarding");
  }

  const { teamId } = await params;
  const teamData = await getTeamPageData(teamId, user.id);

  return <TeamPageClient initialData={teamData} teamId={teamId} />;
}
