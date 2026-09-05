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

  const dashboardData = await getDashboardData(user.id, user.schoolId, {
    name: user.name,
    surname: user.surname,
    schoolName: user.school?.name ?? "La tua scuola",
  });
  const verificationStatus = user.emailVerified ? null : await getEmailVerificationStatus(user.id);

  return (
    <UserDashboard
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
