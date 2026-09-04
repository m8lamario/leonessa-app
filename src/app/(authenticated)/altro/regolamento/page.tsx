import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { SupportPage } from "@/features/altro";
import { isOnboardingComplete, requireUserForPage } from "@/features/auth/server/guards";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Regolamento | Leonessa",
};

export default async function AltroRegolamentoPage() {
  const user = await requireUserForPage();
  if (!isOnboardingComplete(user)) redirect("/onboarding");

  return (
    <SupportPage
      title="Regolamento"
      kicker="Supporto"
      lead="Le regole ufficiali della Leonessa Cup saranno pubblicate in questa pagina."
      emptyTitle="Regolamento in arrivo"
      emptyMessage="Il testo ufficiale non è ancora disponibile."
    />
  );
}
