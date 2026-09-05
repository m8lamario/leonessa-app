import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { isOnboardingComplete, requireUserForPage } from "@/features/auth/server/guards";
import { ApplicationsPage } from "@/features/profile";
import { getCandidaturePageData } from "@/features/profile/server";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Candidature | Leonessa",
};

export default async function CandidaturePage() {
  const user = await requireUserForPage();

  if (!isOnboardingComplete(user)) {
    redirect("/onboarding");
  }

  const candidature = await getCandidaturePageData({
    userId: user.id,
    schoolId: user.schoolId,
  });

  return <ApplicationsPage candidature={candidature} />;
}
