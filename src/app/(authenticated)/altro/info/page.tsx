import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { SupportPage } from "@/features/altro";
import { isOnboardingComplete, requireUserForPage } from "@/features/auth/server/guards";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Informazioni | Leonessa",
};

export default async function AltroInfoPage() {
  const user = await requireUserForPage();
  if (!isOnboardingComplete(user)) redirect("/onboarding");

  return (
    <SupportPage
      title="Informazioni Leonessa"
      kicker="Supporto"
      lead="La presentazione della Leonessa Cup e della piattaforma."
      emptyTitle="Informazioni in arrivo"
      emptyMessage="I contenuti istituzionali non sono ancora stati pubblicati."
    />
  );
}
