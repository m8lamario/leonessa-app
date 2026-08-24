import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { SupportPage } from "@/features/altro";
import { isOnboardingComplete, requireUser } from "@/features/auth/server/guards";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Assistenza | Leonessa",
};

export default async function AltroAssistenzaPage() {
  const user = await requireUser();
  if (!isOnboardingComplete(user)) redirect("/onboarding");

  return (
    <SupportPage
      title="Assistenza"
      kicker="Supporto"
      lead="Canali di aiuto per problemi sull'account, i punteggi o l'app."
      emptyTitle="Assistenza in preparazione"
      emptyMessage="I canali di assistenza non sono ancora attivi."
    />
  );
}
