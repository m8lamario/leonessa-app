import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { EsploraPage } from "@/features/altro";
import { getExploreData } from "@/features/altro/server";
import { isOnboardingComplete, requireUserForPage } from "@/features/auth/server/guards";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Esplora | Leonessa",
};

export default async function AltroEsploraPage() {
  const user = await requireUserForPage();
  if (!isOnboardingComplete(user)) redirect("/onboarding");

  const data = await getExploreData(user.id, user.schoolId);

  return <EsploraPage data={data} />;
}
