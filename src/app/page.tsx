import { redirect } from "next/navigation";

import { isOnboardingComplete, requireUser } from "@/features/auth/server/guards";
import { UserDashboard } from "@/features/dashboard";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await requireUser();

  if (!isOnboardingComplete(user)) {
    redirect("/onboarding");
  }

  const userName = [user.name, user.surname].filter(Boolean).join(" ");
  const userInitials = [user.name, user.surname]
    .filter(Boolean)
    .map((value) => value?.slice(0, 1).toUpperCase())
    .join("");

  return (
    <UserDashboard
      userName={userName || "Tifoso"}
      userInitials={userInitials || "LC"}
      schoolName={user.school?.name ?? "La tua scuola"}
      schoolShortName={user.school?.shortName ?? "LC"}
    />
  );
}
