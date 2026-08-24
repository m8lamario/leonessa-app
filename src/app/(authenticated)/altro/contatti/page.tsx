import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { SupportPage } from "@/features/altro";
import { isOnboardingComplete, requireUser } from "@/features/auth/server/guards";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Contatti | Leonessa",
};

export default async function AltroContattiPage() {
  const user = await requireUser();
  if (!isOnboardingComplete(user)) redirect("/onboarding");

  return (
    <SupportPage
      title="Contatti"
      kicker="Supporto"
      lead="I recapiti ufficiali Leonessa saranno indicati qui, senza indirizzi inventati."
      emptyTitle="Contatti non ancora disponibili"
      emptyMessage="Quando i recapiti ufficiali saranno pubblicati li troverai in questa pagina."
    />
  );
}
