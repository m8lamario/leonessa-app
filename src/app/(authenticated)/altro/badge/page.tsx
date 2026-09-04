import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { BadgePage } from "@/features/altro";
import { getHubData } from "@/features/altro/server";
import { isOnboardingComplete, requireUserForPage } from "@/features/auth/server/guards";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Badge | Leonessa",
};

export default async function AltroBadgePage() {
  const user = await requireUserForPage();
  if (!isOnboardingComplete(user)) redirect("/onboarding");

  const data = await getHubData(user.id, user.schoolId);

  return <BadgePage earned={data.badges.earned} locked={data.badges.locked} />;
}
