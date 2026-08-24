import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { isOnboardingComplete, requireUser } from "@/features/auth/server/guards";
import { ProfileDashboard } from "@/features/profile";
import { getProfileIdentity } from "@/features/profile/server";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Profilo | Leonessa",
};

export default async function ProfilePage() {
  const user = await requireUser();

  if (!isOnboardingComplete(user)) {
    redirect("/onboarding");
  }

  const primaryRole = user.roles.find((role) => role.isPrimary)?.role ?? "USER";
  const identity = await getProfileIdentity(user.id, user.schoolId, user.school?.name ?? null);

  return (
    <ProfileDashboard
      email={user.email}
      identity={identity}
      name={[user.name, user.surname].filter(Boolean).join(" ") || "Tifoso Leonessa"}
      role={primaryRole}
    />
  );
}
