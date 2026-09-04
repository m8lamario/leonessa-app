import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { MissioniPage } from "@/features/altro";
import { getHubData } from "@/features/altro/server";
import { isOnboardingComplete, requireUserForPage } from "@/features/auth/server/guards";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Missioni | Leonessa",
};

export default async function AltroMissioniPage() {
  const user = await requireUserForPage();
  if (!isOnboardingComplete(user)) redirect("/onboarding");

  const data = await getHubData(user.id, user.schoolId);

  return <MissioniPage active={data.missions.active} completed={data.missions.completed} />;
}
