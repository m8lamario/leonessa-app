import { redirect } from "next/navigation";

import { getEmailVerificationStatus } from "@/features/auth/server/account-service";
import { isOnboardingComplete, requireUserForPage } from "@/features/auth/server/guards";
import { UserDashboard } from "@/features/dashboard";
import { getDashboardData } from "@/features/dashboard/server/dashboard-service";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await requireUserForPage();

  if (!isOnboardingComplete(user)) {
    redirect("/onboarding");
  }

  const dashboardData = await getDashboardData(user.id, user.schoolId);
  const verificationStatus = user.emailVerified ? null : await getEmailVerificationStatus(user.id);
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
      data={dashboardData}
      verificationStatus={
        verificationStatus && {
          ...verificationStatus,
          sentAt: verificationStatus.sentAt?.toISOString() ?? null,
          cooldownEndsAt: verificationStatus.cooldownEndsAt?.toISOString() ?? null,
        }
      }
    />
  );
}
