import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AuthCard } from "@/features/auth/components/auth-card";
import { OnboardingForm } from "@/features/auth/components/onboarding-form";
import { getAuthSession, isOnboardingComplete } from "@/features/auth/server/guards";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Completa il profilo | Leonessa",
};

export default async function OnboardingPage() {
  const session = await getAuthSession();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const [user, schools] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      include: { roles: { where: { revokedAt: null } } },
    }),
    prisma.school.findMany({
      where: { deletedAt: null },
      orderBy: { name: "asc" },
      select: { id: true, name: true, shortName: true },
    }),
  ]);

  if (!user) {
    redirect("/login");
  }

  if (isOnboardingComplete(user)) {
    redirect("/profile");
  }

  return (
    <AuthCard title="Completa il tuo profilo">
      <OnboardingForm
        initialName={user.name ?? ""}
        initialSurname={user.surname ?? ""}
        initialInstagram={user.instagram ?? ""}
        schools={schools}
      />
    </AuthCard>
  );
}
