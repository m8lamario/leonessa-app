import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { isOnboardingComplete, requireUserForPage } from "@/features/auth/server/guards";
import { ProfileDashboard } from "@/features/profile";
import { getAccountPageData } from "@/features/profile/server";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Account | Leonessa",
};

export default async function ProfilePage() {
  const user = await requireUserForPage();

  if (!isOnboardingComplete(user)) {
    redirect("/onboarding");
  }

  const primaryRole = user.roles.find((role) => role.isPrimary)?.role ?? "USER";
  const account = await getAccountPageData({
    userId: user.id,
    email: user.email,
    name: user.name,
    surname: user.surname,
    role: primaryRole,
    schoolName: user.school?.name ?? null,
  });

  return <ProfileDashboard account={account} />;
}
