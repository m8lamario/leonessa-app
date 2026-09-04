import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { SupportPage } from "@/features/altro";
import { isOnboardingComplete, requireUserForPage } from "@/features/auth/server/guards";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "FAQ | Leonessa",
};

export default async function AltroFaqPage() {
  const user = await requireUserForPage();
  if (!isOnboardingComplete(user)) redirect("/onboarding");

  return (
    <SupportPage
      title="FAQ"
      kicker="Supporto"
      lead="Risposte alle domande più frequenti su app, LP e partecipazione."
      emptyTitle="Nessuna FAQ pubblicata"
      emptyMessage="Le domande frequenti compariranno qui quando saranno pronte."
    />
  );
}
