import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { isOnboardingComplete, requireUser } from "@/features/auth/server/guards";
import { RankingDashboard } from "@/features/ranking";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Ranking | Leonessa",
};

export default async function RankingPage() {
  const user = await requireUser();

  if (!isOnboardingComplete(user)) {
    redirect("/onboarding");
  }

  const userName = [user.name, user.surname].filter(Boolean).join(" ") || "Tifoso";
  const userInitials =
    [user.name, user.surname]
      .filter(Boolean)
      .map((value) => value?.slice(0, 1).toUpperCase())
      .join("") || "LC";

  return (
    <RankingDashboard
      schoolName={user.school?.name ?? "La tua scuola"}
      schoolShortName={user.school?.shortName ?? "LC"}
      userInitials={userInitials}
      userName={userName}
    />
  );
}
