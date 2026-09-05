import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { isOnboardingComplete, requireUserForPage } from "@/features/auth/server/guards";
import { SettingsPage } from "@/features/profile";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Impostazioni | Leonessa",
};

export default async function ImpostazioniPage() {
  const user = await requireUserForPage();

  if (!isOnboardingComplete(user)) {
    redirect("/onboarding");
  }

  return <SettingsPage />;
}
