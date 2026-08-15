import { redirect } from "next/navigation";

import { isOnboardingComplete, requireUser } from "@/features/auth/server/guards";
import { TeamPage } from "@/features/team";

export const dynamic = "force-dynamic";

export default async function TeamDetailPage({ params }: { params: Promise<{ teamId: string }> }) {
  const user = await requireUser();

  if (!isOnboardingComplete(user)) {
    redirect("/onboarding");
  }

  const { teamId } = await params;

  return <TeamPage teamId={teamId} />;
}
